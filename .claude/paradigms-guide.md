# Paradigms Guide

This guide documents the patterns and conventions within this project.

## Project technologies

- the routing for this project is Express.js
- the template engine for this project is ejs
- installation and maintenance tasks are defined as make targets in the file Makefile
    - the make targets run scripts located in the `bin/` directory
- installation and maintenance tasks are also added as npm script commands in `package.json`
    - the npm script commands run the make targets defined in the file Makefile
- this project uses sqlite3 for its database
    - the database stores words and the schema changes that have been applied
- the `bin/` scripts are written in bash

## File and directory structure

### Router files

- routes are mounted in Express.js through the `server.js` file
- routes files are present in the `routes/` directory and should never be outside of the `routes/` directory
- each route file contains definitions for the endpoints within that route
    - eg: `routes/home.js` is mounted at `/`, so the endpoints defined in `routes/home.js` are relative to `/`
- the endpoints defined within `routes/api.js` always respond with JSON and never render an ejs template

### Template files

- templates are located in the `views/` directory
- the templates corresponding to the routes defined in `routes/` are located in the base of the `views/` directory
- the `views/includes/` directory contains files that are included within the base views templates
    - eg: `views/includes/header.ejs` defines the html header which is used in all of the base views
    - eg: `views/includes/footer.ejs` defines the html footer which is used in all of the base views
    - include files may also include other include files
    - `views/includes/header.ejs` loads files specific to each route and template by reading the `id` parameter defined by the calling template
        - eg: `views/home.ejs` includes `views/includes/header.ejs` passing in the `id` parameter, which tells `views/includes/header.ejs` to load `/js/spicyipsum-sdk.js` and `/js/home.js`

### Model files

- the files located in the `models/` directory define CRUD operations for interacting with database tables
- each model file in `models/` inherits from the `models/base.js` model, which does not correspond to a specific database table

### Public files

- the files located in the `public/` directory contain Javascript, CSS, and the source files of 3rd party dependencies used within the project
    - `public/css` contains the CSS used within the project
    - `public/js` contains the JS used within the project
        - `public/js/home.js` is loaded when `views/home.ejs` includes `views/includes/header.ejs`
        - `public/js/spicyipsum-sdk.js` is also loaded through `views/home.ejs` and is included the same way `public/js/home.js` is loaded
    - `public/src` contains the 3rd party dependencies for the project
        - eg: jquery, bootstrap, and bootstrap-icons are used within the project and reside in this directory
        - directories for 3rd party dependencies should also be named with the version number
            - eg: `public/src/bootstrap-5.3.3` is bootstrap version 5.3.3
        - 3rd party dependencies are always loaded from disk and not from CDN
- public files are served as static content through Express.js, defined in `server.js`

### Lib files

- the files located in the `lib/` directory contain functionality used throughout the project
    - `lib/dbh.js` loads the database and returns the database handle
    - `lib/config.js` reads the configuration in `.spicyipsumrc`, checks for correct configuration variables, and returns the parsed configuration
    - `lib/response.js` defines HTTP response codes and strings

### Configuration file

- `.spicyipsumrc` contains configuration values for running the project
- there are two sections to the config
    - `app` which defines values for Express.js to run the project
    - `user_agent_blocks` which defines user-agent strings that should not be accessing the project
        - much to your potential chagrin, `claude` and `anthropic` are defined in the file because I don't want it accessing the project running in production
            - generally speaking, I don't want any AI scrapers accessing the project running in production
            - `facebookexternalhit` has been found to access the development server running on my local network, which is not allowed and very disconcerting

### Test files

- test files are located in the `tests/` directory
- test files for shared library files (`lib/`) should always be unit tests
    - eg: the tests should mock all external calls, including but not limited to, filesystem reading and writing, HTTP requests including but not limited to API calls, and sending and receiving emails
