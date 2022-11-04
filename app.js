const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const inputCheck = require('./utils/inputCheck');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = new sqlite3.Database('./db/election.db', err => {
    // if connection error
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the election database!');
});

// GET all candidates route /api/candidates (express)
app.get('/api/candidates', (req, res) => {
    console.log('client req', req);
    const sql = `SELECT candidates.*, parties.name
                AS party_name
                FROM candidates
                LEFT JOIN parties
                ON candidates.party_id = parties.id`;
    const params = [];
    
    // Use the all method to return all matching rows
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            message: 'success',
            data: rows
        });
    });
});

// GET a single candidate /api/candidate/:id (express)
app.get('/api/candidate/:id', (req, res) => {
    const sql = `SELECT candidates.*, parties.name
                AS party_name
                FROM candidates
                LEFT JOIN parties
                ON candidates.party_id = parties.id
                WHERE candidates.id = ?`;
    // params as an array
    const params = [req.params.id];
    // console.log('client req', req.params);
    db.get(sql, params, (err, row) => {
        // this error isn't working correctly?
        console.log('err',err);
        if( err ) {
            
            res.status(400).json({ error: err.message });
            return;
        }

        res.json({
            message: 'success',
            data: row
        });
    });
});

// GET all parties route /api/parties (express)
app.get('/api/parties', (req, res) => {
    const sql = `SELECT * FROM parties`;
    const params = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({
            message: 'success',
            data: rows
        });
    });
});

// GET a single party /api/party/:id (express)
app.get('/api/party/:id', (req, res) => {
    const sql = `SELECT * FROM parties WHERE id = ?`;
    const params = [req.params.id];

    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        res.json({
            message: 'success',
            data: row
        });
    });
});

// UPDATE candidate party /api/candidate/:id
app.put( '/api/candidate/:id' , (req, res) => {
    const errors = inputCheck(req.body, 'party_id');
    if (errors) {
        res.status(400).json({ error: errors });
        return;
    }
    const sql = `UPDATE candidates SET party_id = ?
            WHERE id = ?`;
    const params = [req.body.party_id, req.params.id];
    
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status( 400).json({ error: err.message});
            return ;
        }
    
        res.json({
            message: 'success' ,
            data: req.body,
            changes : this .changes
        }) ;
    });
});

// DELETE a candidate /api/candidate/:id (express)
app.delete('/api/candidate/:id', (req, res) => {
    const sql = `DELETE FROM candidates WHERE id = ?`;
    const params = [req.params.id];

    db.run(sql, params, function(err, result) {
        if (err) {
            res.status(400).json({ error: res.message });
            return;
        }
    
        res.json({
            message: 'successfully deleted',
            changes: this.changes
        });
    });
});

// DELETE a party /api/party/:id (express)
app.delete('/api/party/:id', (req, res) => {
    const sql = `DELETE FROM parties WHERE id =?`;
    const params = [req.params.id];

    db.run(sql, params, function(err, result) {
        if (err) {
            res.status(400).json({ error: res.message });
            return;
        }

        res.json({ message: 'successfully deleted', changes: this.changes });
    });
});

// CREATE a candidate
// VALUES uses ? placeholders for the params
app.post('/api/candidate', ({ body }, res) => {
    const errors = inputCheck(body, 'first_name', 'last_name', 'industry_connected');

    if (errors) {
        res.status(400).json({ error: errors });
        return;
    }

    const sql = `INSERT INTO candidates (first_name,last_name, industry_connected)
        VALUES (?,?,?)`;
    const params = [body.first_name, body.last_name, body.industry_connected];

    // ES5 function, not arrow function , to use this
    db.run(sql, params, function(err, result) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        
        res.json({
            message: 'success',
            data: body,
            id: this.lastID
        });
    });
});

// Default response for any other request (not found) catch all
app.use((req, res) => {
    res.status(404).end();
});

// Start server after DB connection
db.on('open', () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);  
    })
})