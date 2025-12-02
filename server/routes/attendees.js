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
            const errors = [];

            for (const [index, row] of results.entries()) {
                // Normalize keys to lowercase to be safe
                const normalizedRow = {};
                for (const key in row) {
                    // Remove quotes, trim, and remove BOM
                    const cleanKey = key.replace(/^[\uFEFF\uFFFE]/, '').replace(/['"]/g, '').toLowerCase().trim();
                    normalizedRow[cleanKey] = row[key];
                }

                // Comprehensive phone number cleaner
                const cleanPhone = (val) => {
                    if (!val) return null;
                    let str = String(val).trim();

                    // Remove all non-digit characters
                    str = str.replace(/\D/g, '');

                    // Handle different formats
                    if (str.length === 13 && str.startsWith('2001')) {
                        // +20 01XXXXXXXXX format
                        str = str.slice(2);
                    } else if (str.length === 12 && str.startsWith('201')) {
                        // 20 01XXXXXXXXX format  
                        str = str.slice(2);
                    } else if (str.length === 10 && str.startsWith('1')) {
                        // 1XXXXXXXXX format (missing leading 0)
                        str = '0' + str;
                    }

                    // Validate: must be 11 digits starting with 01
                    if (str.length === 11 && str.startsWith('01')) {
                        return str;
                    }

                    return null;
                };

                // Try to find phone number from multiple possible columns
                let rawPhone = normalizedRow['phone'] ||
                    normalizedRow['mobile'] ||
                    normalizedRow['phone_number'] ||
                    normalizedRow['personalization.sessionstate.phone'];

                let phoneNumber = cleanPhone(rawPhone);

                // Fallback: scan all values for something that looks like a phone
                if (!phoneNumber) {
                    for (const val of Object.values(row)) {
                        const cleaned = cleanPhone(val);
                        if (cleaned) {
                            phoneNumber = cleaned;
                            break;
                        }
                    }
                }

                if (!phoneNumber) {
                    errors.push({
                        row: index + 1,
                        reason: 'No valid Egyptian phone number found',
                        keys: Object.keys(normalizedRow),
                        phoneValue: rawPhone,
                        actualPhoneColumnValue: normalizedRow['phone']
                    });
                    errorCount++;
                    continue;
                }

                const fullName = normalizedRow['name'] ||
                    normalizedRow['full_name'] ||
                    normalizedRow['personalization.sessionstate.name'];

                const email = normalizedRow['email'] ||
                    normalizedRow['personalization.sessionstate.email'];

                const titleRole = normalizedRow['job'] ||
                    normalizedRow['position'] ||
                    normalizedRow['title'] ||
                    normalizedRow['role'] ||
                    normalizedRow['personalization.sessionstate.job'] ||
                    normalizedRow['personalization.sessionstate.position'];

                try {
                    // MongoDB standalone doesn't support transactions (required by upsert)
                    // So we do manual check + create/update
                    const existing = await prisma.preRegisteredAttendee.findFirst({
                        where: { phoneNumber: String(phoneNumber) }
                    });

                    if (existing) {
                        await prisma.preRegisteredAttendee.updateMany({
                            where: { phoneNumber: String(phoneNumber) },
                            data: {
                                fullName: fullName || null,
                                email: email || null,
                                titleRole: titleRole || null,
                                sourceRow: JSON.stringify(row),
                            }
                        });
                    } else {
                        await prisma.preRegisteredAttendee.create({
                            data: {
                                phoneNumber: String(phoneNumber),
                                fullName: fullName || null,
                                email: email || null,
                                titleRole: titleRole || null,
                                sourceRow: JSON.stringify(row),
                            }
                        });
                    }
                    successCount++;
                } catch (e) {
                    console.error(`Row ${index + 1}: DB Error for ${phoneNumber}:`, e.message);
                    errors.push({
                        row: index + 1,
                        reason: 'Database error: ' + e.message,
                        phone: phoneNumber
                    });
                    errorCount++;
                }
            }

            // Cleanup file
            fs.unlinkSync(req.file.path);

            // Log errors for debugging
            if (errors.length > 0) {
                console.log('Import errors:', JSON.stringify(errors.slice(0, 5), null, 2));
            }

            res.json({
                message: 'Import completed',
                success: successCount,
                errors: errorCount,
                sampleErrors: errors.slice(0, 3)
            });
        });
});

// GET /api/search?phone=...
router.get('/search', async (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        const attendee = await prisma.preRegisteredAttendee.findFirst({
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

        const existing = await prisma.preRegisteredAttendee.findFirst({
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
