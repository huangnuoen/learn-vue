/* @flow */

import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

// 跨端差异化处理 柯里化函数 提前处理差异 只需要处理一次差异
export const patch: Function = createPatchFunction({ nodeOps, modules })
