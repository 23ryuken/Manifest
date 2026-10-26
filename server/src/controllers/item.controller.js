import mongoose from 'mongoose';
import Item from '../models/Item.js';

export async function createFolder(req, res) {
    try {
        const { name, parent } = req.body;
        const owner = req.user.id;

        // Validate the name
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Invalid folder name' });
        }

        const trimmedName = name.trim();

        if (trimmedName.includes('/')) {
            return res
                .status(400)
                .json({ message: 'Folder name cannot contain "/"' });
        }

        // Validate the parent, if one was given
        let parentId = null;

        if (parent) {
            if (!mongoose.isValidObjectId(parent)) {
                return res.status(400).json({ message: 'Invalid parent folder ID' });
            }

            // One query checks: exists + belongs to this user + is a folder
            const parentFolder = await Item.findOne({
                _id: parent,
                owner,
                type: 'folder',
            });

            if (!parentFolder) {
                return res.status(404).json({ message: 'Parent folder not found' });
            }

            parentId = parentFolder._id;
        }

        const newFolder = await Item.create({
            owner,
            name: trimmedName,
            type: 'folder',
            parent: parentId,
        });

        res.status(201).json(newFolder);
    } catch (error) {
        // The unique index is the real guarantee against duplicates
        if (error.code === 11000) {
            return res
                .status(409)
                .json({ message: 'An item with this name already exists here' });
        }

        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}