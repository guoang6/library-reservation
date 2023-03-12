/**
 * Notes: 用户管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY g13340110576 (wechat)
 * Date: 2022-01-22  07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const util = require('../../../../framework/utils/util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const UserModel = require('../../model/user_model.js');
const AdminHomeService = require('./admin_home_service.js');
const { isString } = require('node-xlsx/lib/helpers.js');

// 导出用户数据KEY
const EXPORT_USER_DATA_KEY = 'EXPORT_USER_DATA';

class AdminUserService extends BaseProjectAdminService {


    /** 获得某个用户信息 */
    async getUser ({
        userId,
        fields = '*'
    }) {
        let where = {
            USER_MINI_OPENID: userId,
        }
        return await UserModel.getOne(where, fields);
    }

    /** 取得用户分页列表 */
    async getUserList ({
        search, // 搜索条件
        sortType, // 搜索菜单
        sortVal, // 搜索菜单
        orderBy, // 排序
        whereEx, //附加查询条件 
        page,
        size,
        oldTotal = 0
    }) {

        orderBy = orderBy || {
            USER_ADD_TIME: 'desc'
        };
        let fields = '*';


        let where = {};
        where.and = {
            _pid: this.getProjectId() //复杂的查询在此处标注PID
        };

        if (util.isDefined(search) && search) {
            where.or = [{
                USER_NAME: ['like', search]
            },
            {
                USER_MOBILE: ['like', search]
            },
            {
                USER_MEMO: ['like', search]
            },
            ];

        } else if (sortType && util.isDefined(sortVal)) {
            // 搜索菜单
            switch (sortType) {
                case 'status':
                    where.and.USER_STATUS = Number(sortVal);
                    break;
                case 'sort': {
                    orderBy = this.fmtOrderBySort(sortVal, 'USER_ADD_TIME');
                    break;
                }
            }
        }
        let result = await UserModel.getList(where, fields, orderBy, page, size, true, oldTotal, false);


        // 为导出增加一个参数condition
        result.condition = encodeURIComponent(JSON.stringify(where));

        return result;
    }

    async statusUser (id, status, reason) {
        let whereJoin = {
            _id: id,
        }
        let data = {
            USER_STATUS: status,
            USER_CHECK_REASON: reason
        }
        await NewsModel.edit(whereJoin, data);
        return
    }

    /**删除用户 */
    async delUser (id) {
        let where = {
            _id: id
        }
        let effect = await UserModel.del(where);

        return {
            effect
        };

    }

    // #####################导出用户数据

    /**获取用户数据 */
    async getUserDataURL () {
        return await exportUtil.getExportDataURL(EXPORT_USER_DATA_KEY);
    }

    /**删除用户数据 */
    async deleteUserDataExcel () {
        return await exportUtil.deleteDataExcel(EXPORT_USER_DATA_KEY);
    }

    /**导出用户数据 */
    async exportUserDataExcel (condition, fields) {
        const where = {}
        let result = await UserModel.getAll(where);
        const total = result.length
        const titleName = ['用户昵称', '联系电话', '状态', '创建时间']
        const titleKey = ['USER_NAME', 'USER_MOBILE', 'USER_STATUS', (item) => timeUtil.timestamp2Time(String(item.USER_ADD_TIME))]
        let data = result.map(item => titleKey.map(key => isString(key) ? item[key] : key(item)))
        return await exportUtil.exportDataExcel(EXPORT_USER_DATA_KEY, '用户数据', total, [titleName, ...data]);
    }

}

module.exports = AdminUserService;