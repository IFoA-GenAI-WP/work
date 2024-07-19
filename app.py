import dash
from dash import dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
import base64
from io import BytesIO
import pandas as pd
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("openai_api_key"))

# Initialize the Dash app
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

# Layout of the app
app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("Insurance Claim Analyser"),
            html.Label("Description:"),
            dcc.Textarea(id="description", style={"width": "100%", "height": 100}),
            html.Label("Upload Files:"),
            dcc.Upload(
                id="upload-data",
                multiple=True,
                children=html.Div(["Drag and Drop or ", html.A("Select Files")]),
                style={
                    "width": "100%",
                    "height": "60px",
                    "lineHeight": "60px",
                    "borderWidth": "1px",
                    "borderStyle": "dashed",
                    "borderRadius": "5px",
                    "textAlign": "center",
                    "margin-top": "20px"
                }
            ),
            html.Div(id="uploaded-files"),
            dcc.Store(id='stored-files-data', data=[]),
            dbc.Button("Generate Report", id="generate-button", color="primary", style={"margin-top": "20px"}),
            html.Div(id="output-link")
        ], width=12)
    ])
])

# Helper function to parse uploaded files
def parse_contents(contents, filename):
    content_type, content_string = contents.split(',')
    return content_string, filename

# Callback to display uploaded files and save their contents
@app.callback(
    [Output("uploaded-files", "children"),
     Output("stored-files-data", "data")],
    [Input("upload-data", "contents")],
    [State("upload-data", "filename"),
     State("stored-files-data", "data")]
)
def update_uploaded_files(contents, filenames, stored_files_data):
    if contents is not None:
        for content, filename in zip(contents, filenames):
            file_data, filename = parse_contents(content, filename)
            stored_files_data.append({"filename": filename, "content": file_data})

        children = [
            html.H5("Uploaded Files:"),
            html.Ul([html.Li(file["filename"]) for file in stored_files_data])
        ]
        return children, stored_files_data
    return "", stored_files_data

# Function to generate the prompt for GPT-4
def generate_gpt4_prompt(description, files_data):
    prompt = []
    prompt.append({"type": "text", "text": description})
    for file in files_data:
        content = file["content"]
        try:
            prompt.append({"type": "image_url", "image_url": {
                    "url": f"data:image/png;base64,{content}"}
                })
        except UnicodeDecodeError:
            print("Unicode error")

    return prompt

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Function to call GPT-4 API
def call_gpt4(prompt):
    DENT_IMAGE_PATH = "dent.jpeg"
    dent_base64_image = encode_image(DENT_IMAGE_PATH)
    FRONT_IMAGE_PATH = "front.jpeg"
    front_base64_image = encode_image(FRONT_IMAGE_PATH)

    response = client.chat.completions.create(model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant that responds in Markdown. Help me approximate the claim size based on these images. I want"
         "you to generate a table containing the claim components and estimated repair costs. If there is a total loss, indicate this and factor in salvage value."
         "Any response you generate must have these column headers: 'Vehicle Type', 'Condition Description', 'Estimated Repair/Replacement Cost', 'Total Loss' and 'Salvage Value'"},
        {"role": "user", "content": [
            {"type": "text", "text": "For example, given the below images and the information that the repair will be happening in London "
             " an appropriate response is Black Toyota five-seater car | Damage to passenger side back door, with noticeable scratches and scuff."
              "Scratches appear to be deep enough to have removed the paint, exposing the underlying material. No visible denting or structural damage to the door itself| £500 repair cost | Not a total loss | don't need to salvage"},
            {"type": "image_url", "image_url": {
                "url": f"data:image/png;base64,{dent_base64_image}"}
            },
            {"type": "text", "text": "The above was an example with the black car was to demonstrate what needs to be done. Do this for the image(s) below:"},
        ] + prompt},
    ])
    return response.choices[0].message.content

# Function to parse the GPT-4 response into text and table data
def parse_gpt4_response(gpt4_response):
    lines = gpt4_response.split('\n')
    pre_table_text = []
    table_data = []
    post_table_text = []
    start_table = False
    end_table = False

    for line in lines:
        if not start_table and '|' not in line:
            pre_table_text.append(line)
        elif '|' in line:
            start_table = True
            table_data.append([col.strip() for col in line.split('|')[1:-1]])
        elif start_table and '|' not in line:
            end_table = True
            post_table_text.append(line)

    return "\n".join(pre_table_text).strip(), table_data, "\n".join(post_table_text).strip()

# Function to create TXT for raw response
def create_txt(raw_response):
    txt_buffer = BytesIO()
    txt_buffer.write(raw_response.encode('utf-8'))
    txt_buffer.seek(0)
    return txt_buffer

# Function to create CSV for table data
def create_csv(table_data):
    df = pd.DataFrame(table_data[1:], columns=table_data[0])
    csv_buffer = BytesIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    return csv_buffer

# Callback to process stored file data, call GPT-4, and generate TXT and CSV reports
@app.callback(
    Output("output-link", "children"),
    Input("generate-button", "n_clicks"),
    State("stored-files-data", "data"),
    State("description", "value")
)
def generate_report(n_clicks, files_data, description):
    if n_clicks is None:
        return ""

    if files_data is not None:
        prompt = generate_gpt4_prompt(description, files_data)
        gpt4_response = call_gpt4(prompt)
        print(gpt4_response)

        # Parse the GPT-4 response into text and table data
        pre_table_text, table_data, post_table_text = parse_gpt4_response(gpt4_response)

        # Create the TXT file
        txt_buffer = create_txt(gpt4_response)
        txt_base64 = base64.b64encode(txt_buffer.read()).decode('utf-8')
        txt_link = html.A("Download Evaluation TXT", href=f"data:text/plain;base64,{txt_base64}", download="evaluation.txt", target="_blank")

        # Create the CSV file
        csv_buffer = create_csv(table_data)
        csv_base64 = base64.b64encode(csv_buffer.read()).decode('utf-8')
        csv_link = html.A("Download Damage Estimate CSV", href=f"data:text/csv;base64,{csv_base64}", download="damage_estimate.csv", target="_blank")

        return html.Div([txt_link, html.Br(), csv_link])

    return "No files uploaded."

if __name__ == "__main__":
    app.run_server(debug=True)
