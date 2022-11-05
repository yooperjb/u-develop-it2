const express = require('express');
const router = express.Router();
const db = require('../../db/database');
const inputCheck = require('../../utils/inputCheck');

// GET all candidates route /api/candidates (express)
router.get('/candidates', (req, res) => {
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
router.get('/candidate/:id', (req, res) => {
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

// UPDATE candidate party /api/candidate/:id
router.put( '/candidate/:id' , (req, res) => {
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
router.delete('/candidate/:id', (req, res) => {
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

// CREATE a candidate
// VALUES uses ? placeholders for the params
router.post('/candidate', ({ body }, res) => {
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

module.exports = router;