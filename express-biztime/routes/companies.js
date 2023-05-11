
const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();


router.get('/', async (req, res, next) =>{
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows })
    } catch (e){
    return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        // top is same as the bottom greyed out one
        //let code = req.params.code;
        const compResult = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);

        const invoiceResult = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code]);

        if (compResult.rows.length === 0){
            throw new ExpressError(`Cannot find company with the code of ${code}`, 404)
        }

        const company = compResult.rows[0];
        const invoices = invoiceResult.rows;

        company.invoices = invoices.map(inv => inv.id);

        return res.json({'company': company})
        
    } catch (e){
        return next(e)
    }
});

router.post("/", async (req, res, next) => {
    try {
    const { name, description } = req.body;
    let code = slugify(name, {lower: true});
    const results = await db.query (`INSERT INTO companies 
    (code, name, description) VALUES ($1, $2, $3) 
    RETURNING code, name, description`, 
    [code, name, description]);
    return res.status(201).json ({ 'company': results.rows[0]})
    } catch (e){
        return next(e)
    }
});

router.put("/:code", async (req, res, next) => {
    try {
    let code = req.params.code;
    const { name, description } = req.body;
    const results = await db.query (`UPDATE companies SET name=$1, description=$2 
    WHERE code=$3 
    RETURNING code, name, description`, 
    [name, description, code]);
    if (results.rows.length === 0){
        throw new ExpressError(`Can't update compnay with code of ${code}`, 404)
    } 
    return res.send ({"company": results.rows[0]})
    } catch (e){
    return next (e)
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
    let code = req.params.code;
    const results = db.query(`DELETE FROM companies WHERE code=$1`, [code]);
    if ((await results).rows.length === 0){
        throw new ExpressError (`No company found ${code}`, 404)
    }
    return res.send({status: "DELETED!"})
    } catch (e){
        return next(e)
    }
});

module.exports = router; 
