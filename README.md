# IFoA Generative AI Working Party

Welcome to the IFoA Generative AI Working Party repository.

Visit our [website](https://ifoa-genai-wp.github.io/work/).

## Repository folders

| Folder | Purpose |
| --- | --- |
| [GenAI Survey/](GenAI%20Survey/) | Materials for the GenAI survey conducted in **2025**, including the survey questionnaire. |
| [website/](website/) | Source files for the IFoA Generative AI Working Party website, including pages, images, presentation files, theme files, and build configuration. |

The `.github/` folder contains the website's build, deployment, and dependency-update workflows. It remains at the repository root so GitHub can discover them.

## Working on the website

All website content and supporting files are in `website/`:

- `index.md`: the home page, with Substack as the primary call to action, and expandable team profiles.
- `docs/`: the presentations and blogs/workshops pages.
- `contact.md`: the Contact Us page.
- `assets/`: images, presentation files (PDF), styles, and JavaScript.
- `tools/contact-form/`: Google Forms setup and email notification script; see its [setup guide](website/tools/contact-form/README.md). This folder is excluded from the public website build.
- `_includes/`, `_layouts/`, and `_sass/`: the Jekyll theme. The shared website design and responsive layouts are in `_sass/custom/custom.scss`.
- `_config.yml`: website settings.
- `Gemfile` and `Gemfile.lock`: Ruby dependencies used to build the website.

To preview the website locally, install Ruby 3.3 and Bundler, then run from the repository root:

```sh
cd website
bundle install
bundle exec jekyll serve --baseurl /work
```

Open [the local preview](http://localhost:4000/work/). To build without starting a server, run `bundle exec jekyll build --baseurl /work` from `website/`; the output is written to `website/_site/`.

Changes pushed to `main` are built and published by GitHub Actions using `website/` as the source directory. The published address remains [https://ifoa-genai-wp.github.io/work/](https://ifoa-genai-wp.github.io/work/).
