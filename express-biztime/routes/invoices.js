const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();


router.get('/', async (req, res, next) =>{
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({'invoices': results.rows })
    } catch (e){
    return next(e);
    }1  
});

router.get('/:id', async (req, res, next) => {
    try {
        let id  = req.params.id;
        const result = await db.query(`SELECT 
        i.id, 
        i.comp_code,
        i.amt,
        i.paid,
        i.add_date,
        i.paid_date,
        c.name,
        c.description
        FROM invoices AS i INNER JOIN companies 
        AS c ON (i.comp_code = code) WHERE id = $1`, [id]);
        if (result.rows.length === 0){
            throw new ExpressError(`Cannot find invoice: ${id}`, 404)
        }
        const data = result.rows[0];
        const invoice = {
        id: data.id,
        company: {
            code: data.comp_code,
            name: data.name,
            description: data.description,
        },
        amt: data.amt,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
        };
        return res.json({'invoice': invoice})
    } catch (e){
        return next(e)
    }
});

router.post("/", async (req, res, next) => {
    try {
    let {comp_code, amt} = req.body;
    const results = await db.query (`INSERT INTO invoices
    (comp_code, amt) VALUES ($1, $2) 
    RETURNING comp_code, amt, paid, add_date, paid_date`, 
    [comp_code, amt]);
    return res.status(201).json({ 'invoice': results.rows[0]})
    } catch (e){
        return next(e)
    }
});

router.put("/:id", async (req, res, next) => {
    try {
    let id = req.params.id;
    const { amt } = req.body;
    let paidDate = null;

    const currResult = await db.query(
        `SELECT paid FROM invoices WHERE id=$1`, [id]
    );
    if (currResult.rows.length === 0){
        throw new ExpressError(`No such invoice found`, 404);
    }

    const currPaidDate = currResult.rows[0]

    if (!currPaidDate && paid) {
        paidDate= new Date();
    } else if (!paid){
        paidDate= null
    } else {
        paidDate = currPaidDate
    }
    
    const results = await db.query (`UPDATE invoices SET amt=$1 
    WHERE id=$2 
    RETURNING comp_code, amt, paid, add_date, paid_date`, 
    [amt, id]);
    if (results.rows.length === 0){
        throw new ExpressError(`Can't update invoice with code of ${id}`, 404)
    } 
    return res.send ({"invoice": results.rows[0]})
    } catch (e){
    return next (e)
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
    let id = req.params.id;
    const results = db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    if ((await results).rows.length === 0){
        throw new ExpressError (`No invoice found ${id}`, 404)
    }
    return res.send({status: "DELETED!"})
    } catch (e){
        return next(e)
    }
});


module.exports = router;
