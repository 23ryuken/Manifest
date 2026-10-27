import mongoose from 'mongoose';
import Item from '../models/Item.js';


// Returns the folder document, or null if the id is malformed,
// the folder doesn't exist, belongs to someone else, or is a file.
async function findOwnedFolder(ownerId, folderId) {
    if (typeof folderId !== 'string' || !mongoose.isValidObjectId(folderId)) {
        return null;
    }
    return Item.findOne({ _id: folderId, owner: ownerId, type: 'folder' });
}

// Walks upward from startId through parent links.
// Returns true if it meets targetId (or startId === targetId).
async function isAncestorOrSelf(ownerId, startId, targetId) {
    let currentId = startId;

    while (currentId) {
        if (String(currentId) === String(targetId)) {
            return true;
        }

        const node = await Item.findOne({ _id: currentId, owner: ownerId }).select('parent');
        if (!node) {
            return false;
        }

        currentId = node.parent;
    }

    return false;
}

// Deletes children first, the folder last, so a failure halfway
// never leaves unreachable orphans.
async function deleteFolderAndDescendants(ownerId, folderId) {
    const children = await Item.find({ owner: ownerId, parent: folderId });

    for (const child of children) {
        if (child.type === 'folder') {
            await deleteFolderAndDescendants(ownerId, child._id);
        } else {
            await child.deleteOne(); // Phase 3: also delete the stored file here
        }
    }

    await Item.deleteOne({ _id: folderId, owner: ownerId });
}

// controllers

export async function createFolder(req, res) {
    try {
        const { name, parent } = req.body ?? {};
        const owner = req.user.id;

        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Invalid folder name' });
        }

        const trimmedName = name.trim();

        if (trimmedName.includes('/')) {
            return res.status(400).json({ message: 'Folder name cannot contain "/"' });
        }

        let parentId = null;

        if (parent) {
            const parentFolder = await findOwnedFolder(owner, parent);
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
            const parentFolder = await findOwnedFolder(owner, parent);
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
                return res.status(400).json({ message: 'Item name cannot contain "/"' });
            }

            item.name = trimmedName;
        }

        // Move (only if the client sent a parent; null means top level)
        if (parent !== undefined) {
            if (parent === null) {
                item.parent = null;
            } else {
                const target = await findOwnedFolder(owner, parent);
                if (!target) {
                    return res.status(404).json({ message: 'Parent folder not found' });
                }

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

export async function deleteItem(req, res) {
    try {
        const { id } = req.params;
        const owner = req.user.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid item ID' });
        }

        const item = await Item.findOne({ _id: id, owner });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.type === 'folder') {
            await deleteFolderAndDescendants(owner, item._id);
        } else {
            await item.deleteOne(); // also delete the stored file here
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}