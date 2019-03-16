const readline = require('readline');
const Promise = require('bluebird')
const fs = require('fs'),
    Path = require('path');

function readFile(path) {
    return new Promise((resolve, rejcet) => {
        const raw_paths = [];

        const fileReader = readline.createInterface({
            input: fs.createReadStream(path)
        });

        fileReader.on('line', line => {
            if (line.match(/\/\/ --/))
                raw_paths.push([]);
            else
                raw_paths[raw_paths.length - 1].push(line);
        });

        fileReader.on('close', () => {
            resolve(raw_paths.slice(0, -1));
        });
    })
}

function extractCategories(raw_path) {
    return new Promise((resolve, reject) => {
        if (!raw_path[0].match(/\/\/ PATH:/) || !raw_path[1].match(/\/\/ PROTOCOL:/)) {
            console.log("thu");
            console.log(raw_path);
            return resolve(null);
        }
        const categories = {};
        categories.path = (raw_path[0].split(/:/).slice(1).join(':').trim());
        categories.protocol = (raw_path[1].split(/:/)[1]).trim();
        line = 2;
        while (!raw_path[line].match(/\/\/ INPUT:/))
            line++;
        categories.input = [];
        line++;
        while (!raw_path[line].match(/\/\/ OUTPUT:/)) {
            categories.input.push(raw_path[line]);
            line++;
        }
        line++;
        categories.output = [];
        while (line < raw_path.length) {
            categories.output.push(raw_path[line]);
            line++;
        }
        resolve(categories);
    });
}

if (process.argv[2] == 1)
    readFile('protocol.txt').then(
        raw_paths => {
            const query = [];
            raw_paths.forEach(path => {
                if (path)
                    query.push(extractCategories(path));
            });
            Promise.all(query).then(
                paths => {
                    fs.writeFile('protocol.step1.json', JSON.stringify(paths),
                        err => {
                            if (err)
                                return console.log(err);
                            console.log('[step 1] Sukces!');
                        }
                    )
                }
            );
        }
    );
else if (process.argv[2] == 2) {
    const base_paths = require(Path.join(__dirname, 'protocol.step1.json'));
    base_paths.forEach(path => {
        if (path.protocol == 'GET') {
            let valid = false;
            path.input.forEach(line => {
                if (line.match(/NULL/))
                    valid = true;
            });
            if (!valid) {
                //console.log(path.input);
                path.output.push(path.input);
            }
            else {
                const comments = [];
                path.input.forEach(line => {
                    const splited = line.split(/\/\//);
                    if (splited.length == 2)
                        comments.push(splited[1].trim());
                });
                if (comments.length) {
                    console.log(path.path);
                    console.log(comments);
                    path.comments = comments;
                }
            }
            path.input = null;
        }
    });
    fs.writeFile('protocol.step2.json', JSON.stringify(base_paths),
        err => {
            if (err)
                return console.log(err);
            console.log('[step 2] Sukces!');
        }
    );
}

function parseCategory(lines) {
    //console.log("inside parser");
    //console.log(lines);
    if (!Array.isArray(lines)) {
        return console.log("parse category: nie podano obiektu!");
    }
    if (!lines[0].match(/{/)) {
        console.log(lines);
        return console.log('invalid object!');
    }
    const object = [];
    let i = 1;
    while (!lines[i].match(/}/)) {
        const property = {};
        let line = lines[i].trim();
        i++;
        if (line == '' || line.match(/NULL/))
            continue;
        line = line.split(/:/);
        if (line.length > 2) {
            console.log('Coś poszło nie tak! :::');
        }
        if (line.length >= 2) {
            property.name = line[0].trim();
            line = line[1].split(/\/\//, 1);
            if (line.length == 2)
                property.description = line[1].trim();
            if (line[0].match(/\[/)) {
                property.type = 'Array';
                if (!line[0].match(/]/)) {
                    while (!lines[i].match(/{/))
                        i++;
                    const res = parseCategory(lines.slice(i));
                    property.subObject = res[0];
                    lines = res[1];
                    i = 0;
                    while (!lines[i].match(/]/))
                        i++;
                    i++;
                }
            }
            else if (line[0].match(/{/)) {
                property.type = 'Object';
                if (!line[0].match(/}/)) {
                    const res = parseCategory(['{'].concat(lines.slice(i)));
                    property.subObject = res[0];
                    lines = res[1];
                    i = 0;
                }
            }
            else
                property.type = line[0].trim;
        }
        else {
            line = line[0].split(/\/\//);
            if (line.length != 2) {
                if (line[0].match(/\[FORM]/))
                    property.type = 'form-start';
                else if (line[0].match(/\[\/FORM]/))
                    property.type = 'form-end';
                else
                    console.log('Coś poszło nie tak! ' + line);
            }
            else {
                //console.log('znaleziono komentarz!');
                property.type = 'comment';
                property.description = line[1].trim();
            }
        }
        object.push(property);
    }
    return [object, lines.slice(i)];
}

if (process.argv[2] == 3) {
    const base_paths = require(Path.join(__dirname, 'protocol.step2.json'));
    base_paths.slice(1).forEach(path => {
        //console.log(path.path);
        if (path.input) {
            //console.log(path.input);
            path.input = parseCategory(path.input)[0];
        }
        //console.log(path.output);
        if (Array.isArray(path.output[path.output.length - 1])) {
            //console.log('Array!');
            path.output = parseCategory(path.output.slice(0, -1))[0].concat(parseCategory(path.output[path.output.length - 1])[0]);
        }
        else
            path.output = parseCategory(path.output)[0];
    });
    fs.writeFile('protocol.step3.json', JSON.stringify(base_paths),
        err => {
            if (err)
                return console.log(err);
            console.log('[step 3] Sukces!');
        }
    );
}

function makeMap(table) {
    const map = {};
    table.forEach( value => {
        if(value)
            map[value[0]] = value[1];
    });
    return map;
}

function mapIO(property) {
    if (!property)
        return '';
    if (property.type && property.type == 'Object') {
        return [property.name, {
            description: property.descrition,
            schema: {
                type: 'object',
                properties: makeMap(mapIO(property.subObject))
            }
        }]
    }
    else if (property.type && property.type == 'Array') {
        return [property.name, {
            description: property.description,
            schema: {
                type: 'array',
                items: mapIO(property.subObject)
            }
        }]
    }
    else if (property.type && property.type == 'comment') {
        return property.description.toLowerCase();
    }
    else
        return [property.name, {
            type: property.type || 'string',
            description: property.description
        }];
}

function extractComments(thing) {
    let i = 0;
    const comments = [];
    while (i < thing.length) {
        if (typeof thing[i] === 'string') {
            comments.push(thing[i]);
            thing = thing.slice(0, i).concat(thing.slice(i + 1));
            continue;
        }
        else if (!thing[i].type && thing[i].schema) {
            if (thing[i].schema.type === 'array') {
                const res = extractComments(thing[i].schema.items);
                comments.concat(res[0]);
                thing[i].schema.items = res[1];
            }
            else {
                const res = extractComments(thing[i].schema.properties);
                comments.concat(res[0]);
                thing[i].schema.items = res[1];
            }
        }
        i++;
    }
    return [comments, thing];
}

const toSwagger = {
    'GET': path => {
        const parameters = [];
        let query = path.path.split(/\?/);
        if (query.length == 1)
            query = [];
        else
            query = query[1].split(/&/);
        query.forEach(parameter => {
                parameters.push({
                    in: 'query',
                    name: parameter.split(/=/)[0],
                    type: 'string'
                })
        });
        let output = extractComments(path.output.map(mapIO));
        const comments = output[0];
        output = output[1];
        const swaggerJSON = {
            get: {
                summary: comments.join('; '),
                parameters: parameters,
                responses: {
                    200: {
                        description: 'Success!'
                    }
                }
            }
        };
        if (output.length) {
            swaggerJSON.get.produces = ['application/json'];
            swaggerJSON.get.responses[200].schema = {
                type: 'object',
                properties: makeMap(output)
            };
        }
        return swaggerJSON;
    }, 'POST': path => {
        let isForm = false;
        if (path.input.length && path.input[0].type && path.input[0].type === 'form-start') {
            if (!path.input[path.input.length - 1].type && path.input[path.input.length - 1].type === 'form-end')
                return console.log("invalid form!");
            path.output = path.output.slice(1, -1);
            isForm = true;
        }
        else {
            let input = path.input ? path.input.map(mapIO) : null;
            let output = path.output.map(mapIO);
            input = extractComments(input);
            output = extractComments(output);
            const comments = input[0].concat(output[0]);
            input = input[1];
            output = output[1];
            const parameters = [];
            if (isForm && input)
                input.forEach(entry => {
                    if (entry) {
                        if (!entry[1])
                            entry[1] = {};
                        entry[1].name = entry[0];
                        entry[1].in = 'formData';
                        parameters.push(entry[1]);
                    }
                });
            const swaggerJSON = {
                post: {
                    summary: comments.join('; '),
                    consumes: isForm ? ['application/x-www-form-urlencoded'] : ['application/json'],
                    parameters: isForm ? parameters : [{
                        name: '[no name] : ' + path.path,
                        in: 'body',
                        schema: {
                            type: 'object',
                            properties: makeMap(input)
                        }
                    }],
                    responses: {
                        200: {
                            description: 'Success!'
                        }
                    }
                }
            };
            if (output.length) {
                swaggerJSON.post.produces = ['application/json'];
                swaggerJSON.post.responses[200].schema = {
                        type: 'object',
                        properties: makeMap(output)
                    };
            }
            return swaggerJSON;
        }
    }, 'SocketIO': path => {
        const postSwagger = toSwagger['POST'](path);
        postSwagger.post.tags = ['SocketIO'];
        return postSwagger;
    }, default: path => console.log("Wrong protocol!!! " + path)
};

function pathToSwagger(path) {
    if (!path.protocol || path.protocol.trim() === '') {
        console.log('no protocol!');
        console.log(path.path + ': ' + path.protocol);
        return [path.path, undefined];
    }
    return [path.path, toSwagger[path.protocol](path)];
}

if (process.argv[2] == 4) {
    const base_paths = require(Path.join(__dirname, 'protocol.step3.json'));
    const paths = [];
    base_paths.slice(1).forEach(path => {
        const swaggerPath = pathToSwagger(path);
        if (swaggerPath[1])
            paths.push(swaggerPath);
    });
    fs.writeFile('protocol.step4.json', JSON.stringify(paths),
        err => {
            if (err)
                return console.log(err);
            console.log('[step 4] Sukces!');
        }
    );
}

if(process.argv[2] == 5){
    const base_paths = require(Path.join(__dirname, 'protocol.step4.json'));
    const paths = {};
    base_paths.forEach(path => {
        if(paths[path[0].split(/\?/)[0]])
            Object.keys(path[1]).forEach( protocol => {
                paths[path[0].split(/\?/)[0]][protocol] = path[1][protocol];
            });
        else
            paths[path[0].split(/\?/)[0]] = path[1];
    });
    fs.writeFile('protocol.step5.json', JSON.stringify(paths),
        err => {
            if (err)
                return console.log(err);
            console.log('[step 5] Sukces!');
        }
    );
}

if(process.argv[2] == 6){
    const paths = require(Path.join(__dirname, 'protocol.step5.json'));
    Object.keys(paths).forEach(path => {
        if(path.match(/\/project/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('project');
            });
        else if (path.match(/\/case/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('case');
            });
        else if (path.match(/\/profile/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('profile');
            });
        else if (path.match(/^\/log/) || path.match(/^\/register/) || path.match(/\/recovery/) || path.match(/^\/change/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('authentication');
            });
        else if(path.match(/\/team/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('project');
                paths[path][protocol].tags.push('project/team');
            });
        else if(path.match(/\/reports/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('project');
                paths[path][protocol].tags.push('project/reports');
            });
        else if(path.match(/\/recruitment/))
            Object.keys(paths[path]).forEach( protocol => {
                paths[path][protocol].tags = paths[path][protocol].tags || [];
                paths[path][protocol].tags.push('project');
                paths[path][protocol].tags.push('project/recruitment');
            });
    });
    const swaggerFile = {
        "swagger": "2.0",
        "info": {
            "title": "Invity",
            "description": "Volvo API.",
            "version": "0.1"
        },
        "host": "http://localhost:3000",
        "basePath": "/api",
        "schemes": [
            "http"
        ],
        "consumes": [
            "application/x-www-form-urlencoded",
            "multipart/form-data"
        ],
        "produces": [
            "application/json"
        ],
        "paths": paths,
        "definitions": {
        }
    };
    fs.writeFile('swagger/protocol.json', JSON.stringify(swaggerFile),
        err => {
            if (err)
                return console.log(err);
            console.log('[final step 6] Sukces!');
        }
    );
}