const mongoose = require('../config/db');

const Schema = mongoose.Schema;

const containerSecuritySchema = new Schema(
    {
        name: String,
        dockerCredential: {
            type: Schema.Types.ObjectId,
            ref: 'DockerCredential',
        },
        imagePath: String,
        imageTags: String,
        componentId: {
            type: Schema.Types.ObjectId,
            ref: 'Component',
        },
        resourceCategory: {
            type: Schema.Types.ObjectId,
            ref: 'ResourceCategory',
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        deleteAt: Date,
        lastScan: Date,
        scanned: { type: Boolean, default: false },
        scanning: { type: Boolean, default: false },
    },
    { timestamps: true } //automatically adds createdAt and updatedAt to the schema
);

module.exports = mongoose.model('ContainerSecurity', containerSecuritySchema);
