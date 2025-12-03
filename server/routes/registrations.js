const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const data = req.body;

        // Basic validation
        if (!data.phoneNumber || !data.fullName || !data.email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if already registered
        const existing = await prisma.registration.findFirst({
            where: { phoneNumber: data.phoneNumber }
        });

        if (existing) {
            return res.status(400).json({ error: 'This phone number is already registered.' });
        }

        // Generate QR Code Value
        const qrCodeValue = crypto.randomUUID();

        // Create Registration
        const registration = await prisma.registration.create({
            data: {
                phoneNumber: data.phoneNumber,
                fullName: data.fullName,
                email: data.email,
                isHackathonParticipant: data.isHackathonParticipant,
                attendeeMode: data.attendeeMode,
                attendeeType: data.attendeeType,
                titleRole: data.titleRole,
                companyUniversity: data.companyUniversity,
                placeOfResidence: data.placeOfResidence,
                interestedInSessions: data.interestedInSessions ? JSON.stringify(data.interestedInSessions) : null,
                projectTitle: data.projectTitle,
                howDidYouHear: data.howDidYouHear,
                qrCodeValue: qrCodeValue,
            },
        });

        // Generate QR Code Image (Data URL)
        const checkInUrl = `${process.env.BASE_URL}/check?token=${qrCodeValue}`;
        const qrCodeImage = await QRCode.toDataURL(checkInUrl);

        // Send Email
        const mailOptions = {
            from: '"Hackathon Team" <' + process.env.SMTP_USER + '>',
            to: data.email,
            subject: 'Welcome to Appout AI Vibes Hackathon',
            html: `
        <h1>Welcome, ${data.fullName}!</h1>
        <p>You are registered as a <strong>${data.attendeeMode === 'hackathon_participant' ? 'Hackathon Participant' : 'Sessions Attendee'}</strong>.</p>
        ${data.projectTitle ? `<p><strong>Project Title:</strong> ${data.projectTitle}</p>` : ''}
        <p>Please show this QR code at the entrance:</p>
        <img src="${qrCodeImage}" alt="QR Code" />
        <br/>
        <p>Or click here: <a href="${checkInUrl}">Check-in Link</a></p>
      `,
        };

        // Send email asynchronously (don't block response)
        transporter.sendMail(mailOptions).catch(err => {
            console.error('Failed to send email:', err);
        });

        res.json({ success: true, registration, qrCodeImage });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/check?token=...
router.get('/check', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        const registration = await prisma.registration.findUnique({
            where: { qrCodeValue: token },
        });

        if (!registration) {
            return res.status(404).json({ valid: false, message: 'Invalid QR Code' });
        }

        res.json({
            valid: true,
            registration: {
                fullName: registration.fullName,
                attendeeMode: registration.attendeeMode,
                attendeeType: registration.attendeeType
            }
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/registrations - List all registrations
router.get('/registrations', async (req, res) => {
    try {
        const registrations = await prisma.registration.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ registrations, count: registrations.length });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a registration by ID
router.delete('/registrations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.registration.delete({
            where: { id: Number(id) },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
