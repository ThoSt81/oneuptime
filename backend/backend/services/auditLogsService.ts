export default {
    findBy: async function ({
        query,
        skip,
        limit,
        populate,
        select,
        sort,
    }: FindBy) {
        let auditLogsQuery = AuditLogsModel.find(query)
            .lean()
            .sort(sort)
            .limit(limit.toNumber())
            .skip(skip.toNumber());

        auditLogsQuery = handleSelect(select, auditLogsQuery);
        auditLogsQuery = handlePopulate(populate, auditLogsQuery);

        const auditLogs = await auditLogsQuery;

        return auditLogs;
    },

    countBy: async function ({ query }: Query) {
        if (!query) {
            query = {};
        }

        const count = await AuditLogsModel.countDocuments(query);
        return count;
    },

    create: async function (data: $TSFixMe) {
        const auditLogsModel = new AuditLogsModel({
            userId: data.userId,
            projectId: data.projectId,
            request: data.request,
            response: data.response,
        });

        const auditLog = await auditLogsModel.save();
        return auditLog;
    },

    search: async function ({ filter, skip, limit }: $TSFixMe) {
        const _this = this;
        const query = {
            'request.apiSection': {
                $regex: new RegExp(filter),
                $options: 'i',
            },
        };

        const populateAuditLog = [
            { path: 'userId', select: 'name' },
            { path: 'projectId', select: 'name' },
        ];

        const selectAuditLog = 'userId projectId request response createdAt';

        const [searchedAuditLogs, totalSearchCount] = await Promise.all([
            _this.findBy({
                query,
                skip,
                limit,
                populate: populateAuditLog,
                select: selectAuditLog,
            }),
            _this.countBy({ query }),
        ]);

        return { searchedAuditLogs, totalSearchCount };
    },

    hardDeleteBy: async function ({ query }: $TSFixMe) {
        await AuditLogsModel.deleteMany(query);
    },
};

import AuditLogsModel from 'common-server/models/auditLogs';
import handlePopulate from '../utils/populate';
import FindBy from 'common-server/types/db/FindBy';
import Query from 'common-server/types/db/Query';
import handleSelect from '../utils/select';
