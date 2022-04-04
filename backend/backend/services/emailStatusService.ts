import EmailStatusModel from 'common-server/models/emailStatus';
import GlobalConfigService from './globalConfigService';
import handleSelect from '../utils/select';
import handlePopulate from '../utils/populate';
import FindOneBy from 'common-server/types/db/FindOneBy';
import Query from 'common-server/types/db/Query';
import FindBy from 'common-server/types/db/FindBy';

export default {
    findBy: async function ({
        query,
        limit,
        skip,
        sort,
        populate,
        select,
    }: FindBy) {
        if (!query['deleted']) query['deleted'] = false;
        let itemsQuery = EmailStatusModel.find(query)
            .lean()
            .limit(limit.toNumber())
            .skip(skip.toNumber())
            .sort(sort);

        itemsQuery = handleSelect(select, itemsQuery);
        itemsQuery = handlePopulate(populate, itemsQuery);

        const items = await itemsQuery;

        return items;
    },

    create: async function ({
        from,
        to,
        status,
        subject,
        body,
        template,
        content,
        error,
        smtpServer,
    }: $TSFixMe) {
        const globalConfig = await GlobalConfigService.findOneBy({
            query: { name: 'emailLogMonitoringStatus' },
            select: 'value',
        });
        if (globalConfig && globalConfig.value) {
            let item = new EmailStatusModel();

            item.status = status;

            item.from = from;

            item.to = to;

            item.subject = subject;

            item.body = body;

            item.template = template;

            item.content = content;

            item.error = error;

            item.smtpServer = smtpServer;
            item = await item.save();

            return item;
        }
        return;
    },

    countBy: async function (query: Query) {
        if (!query) {
            query = {};
        }

        if (!query['deleted']) query['deleted'] = false;
        const count = await EmailStatusModel.countDocuments(query);
        return count;
    },

    deleteBy: async function (query: Query, userId: string) {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        const items = await EmailStatusModel.findOneAndUpdate(query, {
            $set: {
                deleted: true,
                deletedAt: Date.now(),
                deletedById: userId,
            },
        });
        return items;
    },

    hardDeleteBy: async function ({ query }: $TSFixMe) {
        await EmailStatusModel.deleteMany(query);
    },

    // Description: Get EmailStatus by item Id.
    // Params:
    // Param 1: monitorId: monitor Id
    // Returns: promise with item or error.
    findOneBy: async function ({ query, populate, select, sort }: FindOneBy) {
        if (!query) {
            query = {};
        }

        query.deleted = false;
        let itemQuery = EmailStatusModel.findOne(query).sort(sort).lean();

        itemQuery = handleSelect(select, itemQuery);
        itemQuery = handlePopulate(populate, itemQuery);

        const item = await itemQuery;
        return item;
    },

    updateOneBy: async function (query: Query, data: $TSFixMe) {
        if (!query) {
            query = {};
        }

        if (!query['deleted']) query['deleted'] = false;

        const updatedEmailStatus = await EmailStatusModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            { new: true }
        );
        return updatedEmailStatus;
    },

    updateBy: async function (query: Query, data: $TSFixMe) {
        if (!query) {
            query = {};
        }

        if (!query['deleted']) query['deleted'] = false;
        let updatedData = await EmailStatusModel.updateMany(query, {
            $set: data,
        });
        const selectEmailStatus =
            'from to subject body createdAt template status content error deleted deletedAt deletedById replyTo smtpServer';

        updatedData = await this.findBy({
            query,
            select: selectEmailStatus,
        });
        return updatedData;
    },

    search: async function ({ filter, skip, limit }: $TSFixMe) {
        const _this = this;
        const query = {
            to: { $regex: new RegExp(filter), $options: 'i' },
        };

        const selectEmailStatus =
            'from to subject body createdAt template status content error deleted deletedAt deletedById replyTo smtpServer';

        const [searchedEmailLogs, totalSearchCount] = await Promise.all([
            _this.findBy({ query, skip, limit, select: selectEmailStatus }),
            _this.countBy({ query }),
        ]);

        return { searchedEmailLogs, totalSearchCount };
    },
};
