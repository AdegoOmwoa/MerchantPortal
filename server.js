const express = require('express');
const mongoose = require('mongoose');

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

app.get('/entries', (req,res) =>{
    res.render("entries");
})
app.get('/debts', async (req,res) =>{
    const debtors = await Debtors.find();
    res.render("debts", {debtors:debtors});
})

app.get('/cash', async (req, res) => {
    const debtors = await Debtors.find();
    res.render('cash', {debtors:debtors});
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

app.post('/submit-data', (req, res) => {
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
    const { debt, amount, desc, status } = req.body;

    const newData = new Debtors({
        debt: debt,
        amount: amount,
        desc: desc,
        status: status
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

app.get('/debts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const debt = await Debt.findById(id);
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
    const { debt, amount, desc, status } = req.body;

    if (!debt || !amount) {
        return res.status(400).send('Please provide debt and amount');
    }

    try {
        const newDebt = new Debt({ debt, amount, desc, status });
        await newDebt.save();
        res.status(201).send('Debt added successfully');
    } catch (error) {
        console.error('Error adding debt:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/mark-paid', async (req, res) => {
    const { id } = req.body;

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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});