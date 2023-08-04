const fs = require('fs');

// Función para analizar un comando de sustitución y extraer las partes de búsqueda y reemplazo
function parseSubstituteCommand(command) {
    const match = command.match(/^s\/([^/]+)\/([^/]*)\/$/);
    if (match) {
        return {
            search: match[1],
            replace: match[2]
        };
    } else {
        return null;
    }
}

// Función principal para realizar los reemplazos en un archivo
function simpleSed(filePath, commands, options) {
    try {
        // Leer el contenido del archivo
        let data = fs.readFileSync(filePath, 'utf8');
        let backupPath = null;

        // Crear una copia de seguridad si se especifica la opción -i
        if (options.i) {
            backupPath = `${filePath}.${options.i}`;
            fs.writeFileSync(backupPath, data, 'utf8');
        }

        // Iterar a través de los comandos de sustitución y aplicarlos
        for (const command of commands) {
            const substituteCommand = parseSubstituteCommand(command);

            if (!substituteCommand) {
                console.error('El comando de sustitucion no es valido. Debe tener el formato: s/buscar/sustituir/');
                continue;
            }

            const searchRegExp = new RegExp(substituteCommand.search, 'g');
            data = data.replace(searchRegExp, substituteCommand.replace);
        }

        // Imprimir las líneas afectadas si se especifica la opción -n
        if (options.n) {
            const lines = data.split('\n');
            const outputLines = options.p ? lines.filter(line => line.includes(substituteCommand.replace)) : lines;
            data = outputLines.join('\n');
            if (options.p) {
                console.log(outputLines.join('\n'));
            }
        }

        // Escribir los cambios en el archivo
        fs.writeFileSync(filePath, data, 'utf8');

        console.log('Reemplazo completado:');
        console.log(data);

        // Imprimir mensaje de copia de seguridad si se creó una
        if (backupPath) {
            console.log(`Copia de seguridad creada: ${backupPath}`);
        }
    } catch (err) {
        console.error('Error al reemplazar el texto:', err);
    }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
const options = {};

// Procesar las opciones de línea de comandos
while (args[0] && args[0].startsWith('-')) {
    const option = args.shift();
    if (option === '-n') {
        options.n = true;
    } else if (option === '-p') {
        options.p = true;
    } else if (option === '-g') {
        options.g = true;
    } else if (option === '-i') {
        options.i = args.shift();
    } else if (option === '-e') {
        options.e = options.e || [];
        options.e.push(args.shift());
    } else if (option === '-f') {
        options.f = args.shift();
    }
}

// Obtener la ruta del archivo y los comandos de sustitución
const filePath = args.shift();
const commands = options.e || [];

// Si se especifica la opción -f, leer los comandos desde el archivo de script
if (options.f) {
    const scriptFilePath = options.f;
    const scriptContent = fs.readFileSync(scriptFilePath, 'utf8');
    const scriptCommands = scriptContent.split('\n');
    commands.push(...scriptCommands);
}

// Verificar si el archivo existe
if (!fs.existsSync(filePath)) {
    console.error('El archivo especificado no existe.');
    process.exit(1);
}

// Llamar a la función para realizar los reemplazos
simpleSed(filePath, commands, options);
