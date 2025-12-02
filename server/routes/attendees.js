const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const prisma = require('../prisma');

const upload = multer({ dest: 'uploads/' });

// POST /api/import
router.post('/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            let errorCount = 0;

            for (const [index, row] of results.entries()) {
                // Normalize keys to lowercase to be safe
                const normalizedRow = {};
                for (const key in row) {
                    // Remove quotes, trim, and remove BOM
                    const cleanKey = key.replace(/^[\uFEFF]/, '').replace(/['"]/g, '').toLowerCase().trim();
                    normalizedRow[cleanKey] = row[key];
                }

                // Helper to clean phone number
                const cleanPhone = (val) => {
                    if (!val) return null;
                    let str = String(val).replace(/\D/g, ''); // Remove non-digits
                    if (str.startsWith('20')) str = str.slice(2); // Remove country code
                    if (str.startsWith('01') && str.length === 11) return str;
                    return null;
                };

                // Map fields based on known CSV headers
                let rawPhone =
                    normalizedRow['personalization.sessionstate.phone'] ||
                    normalizedRow['phone_number'] ||
                    normalizedRow['phone'] ||
                    normalizedRow['mobile'];

                let phoneNumber = cleanPhone(rawPhone);

                // Fallback: Search for a value that looks like an Egyptian phone number
                if (!phoneNumber) {
                    for (const val of Object.values(row)) {
                        const cleaned = cleanPhone(val);
                        if (cleaned) {
                            phoneNumber = cleaned;
                            break;
                        }
                    }
                }

                const fullName =
                    normalizedRow['personalization.sessionstate.name'] ||
                    normalizedRow['full_name'] ||
                    normalizedRow['name'];

                const email =
                    normalizedRow['personalization.sessionstate.email'] ||
                    normalizedRow['email'];

                const titleRole =
                    normalizedRow['personalization.sessionstate.title'] ||
                    normalizedRow['personalization.sessionstate.role'] ||
                    normalizedRow['personalization.sessionstate.job'] ||
                    normalizedRow['personalization.sessionstate.position'] ||
                    normalizedRow['title'] ||
                    normalizedRow['role'] ||
                    normalizedRow['job'] ||
                    normalizedRow['position'];

                if (!phoneNumber) {
                    console.log(`Row ${index + 1}: No phone number found. Keys: ${Object.keys(normalizedRow).join(', ')}`);
                    errorCount++;
                    continue;
                }

                try {
                    await prisma.preRegisteredAttendee.upsert({
                        where: { phoneNumber: String(phoneNumber) },
                        update: {
                            fullName: fullName,
                            email: email,
                            titleRole: titleRole,
                            sourceRow: JSON.stringify(row),
                        },
                        create: {
                            phoneNumber: String(phoneNumber),
                            fullName: fullName,
                            email: email,
                            titleRole: titleRole,
                            sourceRow: JSON.stringify(row),
                        },
                    });
                    successCount++;
                } catch (e) {
                    console.error(`Row ${index + 1}: DB Error for ${phoneNumber}:`, e.message);
                    errorCount++;
                }
            }

            // Cleanup file
            fs.unlinkSync(req.file.path);

            res.json({ message: 'Import completed', success: successCount, errors: errorCount });
        });
});

// GET /api/search?phone=...
router.get('/search', async (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        const attendee = await prisma.preRegisteredAttendee.findUnique({
            where: { phoneNumber: String(phone) },
        });

        if (!attendee) {
            return res.status(404).json({ error: 'Attendee not found' });
        }

        // Check if already registered
        const existingRegistration = await prisma.registration.findFirst({
            where: { phoneNumber: String(phone) },
        });

        res.json({
            attendee,
            isRegistered: !!existingRegistration
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/attendees - List all pre-registered attendees
router.get('/attendees', async (req, res) => {
    try {
        const attendees = await prisma.preRegisteredAttendee.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ attendees, count: attendees.length });
    } catch (error) {
        console.error('Error fetching attendees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/attendees - Create new attendee
router.post('/attendees', async (req, res) => {
    try {
        const { phoneNumber, fullName, email } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const existing = await prisma.preRegisteredAttendee.findUnique({
            where: { phoneNumber }
        });

        if (existing) {
            return res.status(400).json({ error: 'Phone number already exists' });
        }

        const attendee = await prisma.preRegisteredAttendee.create({
            data: {
                phoneNumber,
                fullName,
                email,
                sourceRow: JSON.stringify({ manual: true, ...req.body })
            }
        });

        res.json(attendee);
    } catch (error) {
        console.error('Error creating attendee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/attendees/:id - Update attendee
router.put('/attendees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { phoneNumber, fullName, email } = req.body;

        const attendee = await prisma.preRegisteredAttendee.update({
            where: { id },
            data: {
                phoneNumber,
                fullName,
                email
            }
        });

        res.json(attendee);
    } catch (error) {
        console.error('Error updating attendee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/attendees/:id - Delete attendee
router.delete('/attendees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.preRegisteredAttendee.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting attendee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
