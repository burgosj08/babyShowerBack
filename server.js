const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
// app.use(cors());

const allowedOrigins = [
  'https://baby-shower-paris.vercel.app', 
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(bodyParser.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI,{
// ('mongodb+srv://jaelburgos08:K32E12S1lVlkQlNk@babyshower.u219m.mongodb.net/?retryWrites=true&w=majority&appName=BabyShower', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error: ', err));


const guestSchema = new mongoose.Schema({
  name: String,
  lastname: String,
  status: String,
  family:Boolean,
  confirmed: { type: Boolean, default: false }
});

const giftSchema = new mongoose.Schema({
  name:String,
  description: String,
  price: {
    min: Number,
    max: Number
  },
  image: String,
  enabled: Boolean,
  code: String,
  links: [
    {
      name_link: String,
      url: String
    }
  ]
});



const Guest = mongoose.model('Guest', guestSchema);
const Gift = mongoose.model('Gift', giftSchema);

// Rutas invitados
app.post('/api/guests', async (req, res) => {
  const { name, lastname, status, family } = req.body;
  const newGuest = new Guest({ name, lastname, status, family });
  try {
    await newGuest.save();
    res.status(201).json({ message: 'Guest added successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/guests', async (req, res) => {
  try {
    const guests = await Guest.find();
    res.json(guests);
  } catch (err) {

    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/guests/confirm', async (req, res) => {
  const { guestIds } = req.body; // Recibe un array con los IDs de los invitados a confirmar

  try {
    await Guest.updateMany(
      { _id: { $in: guestIds } }, // Encuentra los invitados en la lista de IDs
      { $set: { confirmed: true } } // Actualiza el campo "confirmed"
    );
    res.json({ message: 'Asistencia confirmada exitosamente!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rutas regalos
app.post('/api/gifts', async (req, res) => {
  const { name, description, price, image, enabled, code, links } = req.body;
  const newGift = new Gift({ name, description, price, image, enabled, code, links });
  try {
    await newGift.save();
    res.status(201).json({ message: 'Gift added successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gifts', async (req, res) => {
  try {
    let query = {};
    const { minPrice, maxPrice, sort } = req.query;

    if (minPrice && maxPrice) {
      query["price.min"] = { $gte: Number(minPrice) };
      query["price.max"] = { $lte: Number(maxPrice) };
    }

    let gifts = await Gift.find(query);

    if (sort === "asc") {
      gifts.sort((a, b) => a.price.min - b.price.min);
    } else if (sort === "desc") {
      gifts.sort((a, b) => b.price.min - a.price.min);
    }

    res.json(gifts);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/gifts/:id", async (req, res) => {
  try {
    const { enabled } = req.body;

  
    const gift = await Gift.findByIdAndUpdate(
      req.params.id,
      { enabled },
      { new: true }
    );

    if (!gift) {
      return res.status(404).json({ error: "Regalo no encontrado" });
    }

    res.json({ message: "Regalo confirmado y bloqueado", gift });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
