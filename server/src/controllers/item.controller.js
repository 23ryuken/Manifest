import mongoose from 'mongoose';
import Item from '../models/Item.js';


async function isAncestorOrSelf(ownerId, startId, targetId) {
    let currentId = startId;

    while (currentId) {
        // ObjectIds are objects, so compare them as strings
        if (String(currentId) === String(targetId)) {
            return true;
        }

        const node = await Item.findOne({ _id: currentId, owner: ownerId }).select('parent');
        if (!node) {
            return false;
        }

        currentId = node.parent; // step up one level; null ends the loop
    }

    return false;
}



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

export async function listItems(req, res) {
    try {
        const owner = req.user.id;
        const { parent } = req.query;

        let parentId = null;

        if (parent) {
            // typeof check rejects ?parent=a&parent=b (array) and ?parent[x]=y (object)
            if (typeof parent !== 'string' || !mongoose.isValidObjectId(parent)) {
                return res.status(400).json({ message: 'Invalid parent folder ID' });
            }

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

        const items = await Item.find({ owner, parent: parentId })
            .sort({ type: -1, name: 1 })
            .collation({ locale: 'en', strength: 2 });

        res.status(200).json({ items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export async function updateItem(req, res) {
    try {
        const { id } = req.params;
        const { name, parent } = req.body ?? {};
        const owner = req.user.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid item ID' });
        }

        if (name === undefined && parent === undefined) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        const item = await Item.findOne({ _id: id, owner });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Rename (only if the client sent a name)
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Invalid item name' });
            }

            const trimmedName = name.trim();

            if (trimmedName.includes('/')) {
                return res
                    .status(400)
                    .json({ message: 'Item name cannot contain "/"' });
            }

            item.name = trimmedName;
        }

        // Move (only if the client sent a parent; null means top level)
        if (parent !== undefined) {
            if (parent === null) {
                item.parent = null;
            } else {
                if (typeof parent !== 'string' || !mongoose.isValidObjectId(parent)) {
                    return res.status(400).json({ message: 'Invalid parent folder ID' });
                }

                const target = await Item.findOne({
                    _id: parent,
                    owner,
                    type: 'folder',
                });

                if (!target) {
                    return res.status(404).json({ message: 'Parent folder not found' });
                }

                // Only folders can contain things, so only folders can cause a loop
                if (
                    item.type === 'folder' &&
                    (await isAncestorOrSelf(owner, target._id, item._id))
                ) {
                    return res.status(400).json({
                        message: 'Cannot move a folder into itself or its own subfolder',
                    });
                }

                item.parent = target._id;
            }
        }

        await item.save();

        res.status(200).json(item);
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(409)
                .json({ message: 'An item with this name already exists here' });
        }

        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}