import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['file', 'folder'],
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null,
        },

        //(file uploads): stay empty on folders
        size: { type: Number },
        mimeType: { type: String },
        storageKey: { type: String },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// No two items with the same name in the same folder for the same owner
itemSchema.index({ owner: 1, parent: 1, name: 1 }, { unique: true });

const Item = mongoose.model('Item', itemSchema);

export default Item;