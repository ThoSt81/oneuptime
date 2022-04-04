export default {
    create: async function (data: $TSFixMe) {
        const LogHour = new MonitorLogByHourModel();

        LogHour.monitorId = data.monitorId;

        LogHour.probeId = data.probeId;

        LogHour.status = data.status;

        LogHour.responseTime = data.responseTime;

        LogHour.responseStatus = data.responseStatus;

        LogHour.cpuLoad = data.cpuLoad;

        LogHour.avgCpuLoad = data.avgCpuLoad;

        LogHour.cpuCores = data.cpuCores;

        LogHour.memoryUsed = data.memoryUsed;

        LogHour.totalMemory = data.totalMemory;

        LogHour.swapUsed = data.swapUsed;

        LogHour.storageUsed = data.storageUsed;

        LogHour.totalStorage = data.totalStorage;

        LogHour.storageUsage = data.storageUsage;

        LogHour.mainTemp = data.mainTemp;

        LogHour.maxTemp = data.maxTemp;

        LogHour.maxResponseTime = data.responseTime;

        LogHour.maxCpuLoad = data.cpuLoad;

        LogHour.maxMemoryUsed = data.memoryUsed;

        LogHour.maxStorageUsed = data.storageUsed;

        LogHour.maxMainTemp = data.mainTemp;

        LogHour.intervalDate = data.intervalDate;

        LogHour.sslCertificate = data.sslCertificate;

        LogHour.kubernetesLog = data.kubernetesData || {};

        const savedLogHour = await LogHour.save();

        return savedLogHour;
    },

    updateOneBy: async function (query: Query, data: $TSFixMe) {
        if (!query) {
            query = {};
        }

        const monitorLogByHour = await MonitorLogByHourModel.findOneAndUpdate(
            query,
            { $set: data },
            {
                new: true,
            }
        );

        return monitorLogByHour;
    },

    async findBy({ query, limit, skip, select, populate, sort }: FindBy) {
        if (!skip) skip = 0;

        if (!limit) limit = 0;

        if (typeof skip === 'string') {
            skip = parseInt(skip);
        }

        if (typeof limit === 'string') {
            limit = parseInt(limit);
        }

        if (!query) {
            query = {};
        }

        let monitorLogsByHourQuery = MonitorLogByHourModel.find(query)
            .lean()
            .sort(sort)
            .limit(limit.toNumber())
            .skip(skip.toNumber());

        monitorLogsByHourQuery = handleSelect(select, monitorLogsByHourQuery);
        monitorLogsByHourQuery = handlePopulate(
            populate,
            monitorLogsByHourQuery
        );

        const monitorLogsByHour = await monitorLogsByHourQuery;

        return monitorLogsByHour;
    },

    async findOneBy({ query, select, populate, sort }: FindOneBy) {
        if (!query) {
            query = {};
        }

        let monitorLogQuery = MonitorLogByHourModel.findOne(query)
            .sort(sort)
            .lean();

        monitorLogQuery = handleSelect(select, monitorLogQuery);
        monitorLogQuery = handlePopulate(populate, monitorLogQuery);

        const monitorLog = await monitorLogQuery;
        return monitorLog;
    },

    async countBy(query: Query) {
        if (!query) {
            query = {};
        }

        const count = await MonitorLogByHourModel.countDocuments(query);

        return count;
    },
};

import MonitorLogByHourModel from 'common-server/models/monitorLogByHour';
import handleSelect from '../utils/select';
import handlePopulate from '../utils/populate';
import FindOneBy from 'common-server/types/db/FindOneBy';
import FindBy from 'common-server/types/db/FindBy';
import Query from 'common-server/types/db/Query';
