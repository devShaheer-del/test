const express = require('express');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const cookie_secret = process.env.COOKIE_SECRET;
const jwt_secret = process.env.JWT_SECRET;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const cors = require('cors');

const StudentsModel = require('./config/StudentModel');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(cookie_secret));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));


const myCache = new NodeCache({    // ✅ 'myCache' (C-a-C-h-e)
    stdTTL: 100,
    checkperiod: 120,
    maxKeys: 1000,
});

// Sync database using async/await
(async () => {
    try {
        await StudentsModel.sync();
        console.log('Database connected and table is created');
    } catch (err) {
        console.log('Connection is failed', err);
    }
})();


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});


app.post('/Student-create', async (req, res) => {
    try {
        const { name, last_name, email, password, gender, phone, address } = req.body;

        // Validation
        if (!name || !last_name || !email || !password || !gender || !phone || !address) {
            return res.status(400).json({
                message: "All fields required",
                success: false
            });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create student
        const student = await StudentsModel.create({
            name,
            last_name,
            email,
            password: hashPassword,
            gender,
            phone,
            address
        });

        return res.status(201).json({
            message: "Student Created Successfully",
            success: true,
            Created_student: student
        });

    } catch (error) {
        console.error('Student create error:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});



app.post('/student-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        const findStudent = await StudentsModel.findOne({ where: { email: email } });


        if (!findStudent) {
            console.log('4. ❌ Student NULL — email match nahi hua');
            return res.status(400).json({ message: "Invalid credentials Email", success: false });
        }

        console.log(`password is : ${findStudent.password}`);


        console.log('DB hash:', findStudent.password);
        console.log('Input password:', JSON.stringify(password));
        console.log('Input password length:', password?.length);

        const isPasswordValid = await bcrypt.compare(password, findStudent.password);
        console.log('✅ Compare result:', isPasswordValid);

        if (!isPasswordValid) {

            return res.status(400).json({ message: "Invalid credentials password", success: false });
        }


        const token = jwt.sign(
            { id: findStudent.id, email: findStudent.email },
            jwt_secret,
            { expiresIn: '10s' }
        );

        const cookie_payload = {
            student_name: findStudent.name,
            student_token: token
        };

        res.cookie('student', JSON.stringify(cookie_payload), {
            secure: false,       // HTTPS only
            httpOnly: true,     // JS se accessible nahi
            sameSite: 'lax', // CSRF protection
            maxAge: 60 * 60 * 1000  // 1 hour (ms mein)
        });

        return res.status(200).json({
            message: "Students login successful",
            success: true,
            token: token

        });

    } catch (error) {
        console.error('Student login error:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});

app.get('/all-users', async (req, res) => {
    try {
        const cacheKey = 'all_users';              // ✅ key ka naam

        // 1. Cache check karein
        const cachedData = myCache.get(cacheKey);  // ✅ get() use kiya

        if (cachedData) {
            console.log('✅ Data cache se aaya');
            return res.status(200).json({
                message: "cache sy mila",
                success: true,
                students: cachedData
            });
        }

        // 2. Cache miss — database se fetch karein
        console.log('❌ Cache miss — database se fetch kar rahe hain');
        const myData = await StudentsModel.findAll();

        // 3. Cache mein store karein
        myCache.set(cacheKey, myData);             // ✅ set() use kiya

        return res.status(200).json({
            message: "Database say mila",
            success: true,
            students: myData
        });

    } catch (error) {
        console.error('All users error:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
});



app.listen(port, () => console.log(`Server running on: http://localhost:${port}`));