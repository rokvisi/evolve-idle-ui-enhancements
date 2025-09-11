import chalk from 'chalk';

function log_request(method: string, pathname: string) {
    const method_chalked =
        {
            GET: chalk.blue(method),
            POST: chalk.green(method),
            PUT: chalk.yellow(method),
            DELETE: chalk.red(method),
        }[method] ?? method;

    const pretty_date = new Date().toLocaleString(undefined, {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    console.log(`[${pretty_date}] ${method_chalked} '${chalk.cyan(pathname)}'`);
}

const server = Bun.serve({
    port: 8080,
    async fetch(req) {
        // Log each request with a timestamp.
        const pathname = new URL(req.url).pathname;
        log_request(req.method, pathname);

        // The root path serves the GM script.
        if (pathname === '/') return Response.redirect('/out/evolve-ui-enhancements.user.js');

        // On all other paths, assume a file request. If the file doesn't exist, the 'error' handler will catch it.
        return new Response(Bun.file(pathname.replace('/', './')));
    },
    error(err) {
        console.error('Server error: ', err);

        // Handle file not found errors.
        if (err.code === 'ENOENT') return new Response('404 - No such file or directory.', { status: 404 });

        // Handle all other errors.
        return new Response('500 - Internal Server Error.', { status: 500 });
    },
});

console.log(
    `${chalk.yellow('Serving project files on:')} ${server.url.protocol}//${server.url.hostname}:${chalk.green(server.port)}\n`
);
