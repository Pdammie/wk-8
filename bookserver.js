const http = require('http');
const url = require('url');

// In-memory book array
let books = [];
let nextId = 1;

// Utility to parse request body
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                resolve(data);
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Enable CORS and JSON headers
    res.setHeader('Content-Type', 'application/json');

    // Route: GET /books
    if (method === 'GET' && pathname === '/books') {
        res.writeHead(200);
        res.end(JSON.stringify(books));
        return;
    }

    // Route: GET /books/:name
    if (method === 'GET' && pathname.startsWith('/books/')) {
        const name = decodeURIComponent(pathname.split('/')[2]);
        const book = books.find(b => b.name.toLowerCase() === name.toLowerCase());
        if (!book) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Book not found' }));
        } else {
            res.writeHead(200);
            res.end(JSON.stringify(book));
        }
        return;
    }

    // Route: POST /books
    if (method === 'POST' && pathname === '/books') {
        try {
            const data = await parseRequestBody(req);
            const { name, description, content } = data;

            if (!name || !description || !content) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
            }

            const newBook = { id: nextId++, name, description, content };
            books.push(newBook);

            res.writeHead(201);
            res.end(JSON.stringify({ message: 'Book created', book: newBook }));
        } catch (err) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Route: PUT /books/:id
    if (method === 'PUT' && pathname.startsWith('/books/')) {
        const id = parseInt(pathname.split('/')[2]);
        if (isNaN(id)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid ID' }));
            return;
        }

        try {
            const data = await parseRequestBody(req);
            const { name, content } = data;

            if (!name || !content) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Missing name or content' }));
                return;
            }

            const book = books.find(b => b.id === id);
            if (!book) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Book not found' }));
                return;
            }

            book.name = name;
            book.content = content;

            res.writeHead(200);
            res.end(JSON.stringify(book));
        } catch (err) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Route: DELETE /books/:id
    if (method === 'DELETE' && pathname.startsWith('/books/')) {
        const id = parseInt(pathname.split('/')[2]);
        if (isNaN(id)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid ID' }));
            return;
        }

        const index = books.findIndex(b => b.id === id);
        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Book not found' }));
            return;
        }

        books.splice(index, 1);
        res.writeHead(200);
        res.end(JSON.stringify({ message: 'Book deleted' }));
        return;
    }

    // 404 for unrecognized routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
