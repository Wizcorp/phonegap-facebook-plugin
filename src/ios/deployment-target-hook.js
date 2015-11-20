'use strict'
/**
 * adjust-ios-deployment-target
 * cordova hook to adjust iOS target to IOS_DEPLOYMENT_TARGET
 * Installation:
 *  in config.xml set
 *  inside `<platform name="ios">`
 *  <hook type="after_platform_add" src="scripts/adjust-ios-deployment-target.js" />
 */

var IOS_DEPLOYMENT_TARGET = '7.0'

var fs = require('fs')
var path = require('path')
var xcode = require('xcode')
var parser = require('xml-parser')
var chalk = require('chalk')

function findPropSync (obj, prop, fn) {
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      if (typeof obj[p] === 'object') {
        findPropSync(obj[p], prop, fn)
      } else if (p === prop) {
        if (typeof fn === 'function') fn(obj, p)
      }
    }
  }
}

function updateDeploymentTarget (xcodeProject, xcodeProjectPath, targetVersion) {
  var targetVersionNum = parseFloat(targetVersion)
  if (isNaN(targetVersionNum)) throw new Error('Invalid deployment target')

  var buildConfig = xcodeProject.pbxXCBuildConfigurationSection()
  var changed = false
  findPropSync(buildConfig, 'IPHONEOS_DEPLOYMENT_TARGET', function (obj, p) {
    if (parseFloat(obj[p]) < targetVersionNum) {
      obj[p] = '' + targetVersion
      changed = true
    } else {
      console.log('deployment target ok')
    }
  })
  return changed
}

function getProjectName (projectRoot) {
  var content = fs.readFileSync(path.join(projectRoot, 'config.xml'), 'utf8')
  var data = parser(content)
  var projectName
  data.root.children.some(function (node) {
    if (node.name === 'name') {
      projectName = node.content
      return true
    }
    return false
  })
  if (projectName == null) {
    throw new TypeError('Failed to parse config.xml')
  }
  return projectName
}

module.exports = function run (context) {
  var projectName = getProjectName(context.opts.projectRoot)
  var xcodeProjectName = projectName + '.xcodeproj'
  var xcodeProjectPath = path.join(context.opts.projectRoot, 'platforms', 'ios', xcodeProjectName, 'project.pbxproj')

  if (!fs.existsSync(xcodeProjectPath)) {
    return
  }

  var xcodeProject = xcode.project(xcodeProjectPath)

  console.log('Updating ' + projectName + '\'s config for Facebook SDK 4')

  xcodeProject.parse(function (err) {
    if (err) {
      console.error(chalk.red('An error occured during parsing of [' + xcodeProjectPath + ']: '), JSON.stringify(err))
      return
    }
    var didWrite = updateDeploymentTarget(xcodeProject, xcodeProjectPath, IOS_DEPLOYMENT_TARGET)
    if (didWrite) {
      fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync(), 'utf-8')
      console.log(chalk.green('Updated ' + projectName + '\'s config for Facebook SDK 4'))
    } else {
      console.log(chalk.green(projectName + ' is already prepared'))
    }
  })
}
