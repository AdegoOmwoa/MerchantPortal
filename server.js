const express = require('express');
const mongoose = require('mongoose');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const app = express();

mongoose.connect('mongodb://0.0.0.0/MEPROTOCOL');

const dataSchema = new mongoose.Schema({
    date: Date,
    value: Number
});

const Data = mongoose.model('Data', dataSchema);

const debtSchema = new mongoose.Schema({
    debt: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    desc: String,
    status: {
        type: String,
        enum: ['paid', 'unpaid'],
        default: 'unpaid',
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

const Debtors = mongoose.model('Debtors', debtSchema);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/entries', (req, res) => {
    res.render("entries");
});

app.get('/debts', async (req, res) => {
    const debtors = await Debtors.find();
    res.render("debts", { debtors: debtors });
});

app.get('/cash', async (req, res) => {
    const debtors = await Debtors.find();
    res.render('cash', { debtors: debtors });
});

app.get('/data', (req, res) => {
    Data.find({})
        .then(data => {
            res.json(data);
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/submit-data', (req, res, next) => {
    req.debtors = new Debtors();
    next();
    const { date, value } = req.body;

    const newData = new Data({
        date: new Date(date),
        value: value
    });

    newData.save()
        .then(savedData => {
            console.log('Data saved to database:', savedData);
            res.redirect('/entries');
        })
        .catch(err => {
            console.error('Error saving data to database:', err);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/submit-debt', (req, res) => {
    const { debt, amount, desc, status, date } = req.body;

    const newData = new Debtors({
        debt: debt,
        amount: amount,
        desc: desc,
        status: status,
        date: date,
    });

    newData.save()
        .then(savedData => {
            res.redirect('/debts');
        })
        .catch(err => {
            console.error('Error saving data to database:', err);
            res.status(500).send('Internal Server Error');
        });
});

// Ensure the specific upload-to-cloud route is defined first
app.get('/upload-to-cloud', async (req, res) => {
    try {
        const debtors = await Debtors.find({});
        const data = JSON.stringify(debtors, null, 2);

        const fileName = `debtors_${Date.now()}.json`;
        const file = storage.bucket(bucketName).file(fileName);

        await file.save(data, {
            metadata: {
                contentType: 'application/json',
            },
            resumable: false,
        });

        res.send('Debtors data has been uploaded to Google Cloud Storage.');
    } catch (error) {
        console.error('Error uploading to Google Cloud Storage:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Validate ObjectId before querying
app.get('/debts/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID format');
    }

    try {
        const debt = await Debtors.findById(id);
        if (!debt) {
            return res.status(404).send('Debt not found');
        }
        res.json(debt);
    } catch (error) {
        console.error('Error fetching debt:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/debts', async (req, res) => {
    const { debt, amount, desc, status, date } = req.body;

    if (!debt || !amount) {
        return res.status(400).send('Please provide debt and amount');
    }

    try {
        const newDebt = new Debtors({ debt, amount, desc, status, date });
        await newDebt.save();
        res.status(201).send('Debt added successfully');
    } catch (error) {
        console.error('Error adding debt:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/mark-paid', async (req, res) => {
    const { id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID format');
    }

    try {
        const updatedDebt = await Debtors.findByIdAndUpdate(id, { status: 'paid' });

        if (!updatedDebt) {
            return res.status(404).send('Debt not found');
        }
        res.redirect("/debts");

        // res.sendStatus(200)
    } catch (error) {
        console.error('Error marking debt as paid:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/edit-amount/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID format');
    }

    try {
        const debtorId = await Debtors.findById(id);

        if (!debtorId) {
            return res.status(404).send('Debtor not found');
        }

        res.render('edit-amount', { debtorId: debtorId });
    } catch (error) {
        console.error('Error fetching debtor:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/edit-amount/:id", async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID format');
    }

    const { amount, desc } = req.body;

    try {
        const updatedDebtor = await Debtors.findByIdAndUpdate(
            id,
            { $set: { amount: amount, desc: desc } },
            { new: true }
        );

        if (!updatedDebtor) {
            return res.status(404).send('Debtor not found');
        }

        res.redirect("/debts");

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle searches
app.get('/search-debts', async (req, res) => {
    const query = req.query.query;
    const debtors = await Debtors.find({ debt: { $regex: query, $options: 'i' } });
    res.render('debts', { debtors });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
