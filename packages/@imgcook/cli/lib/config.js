const dsl = [
  {
    name: 'H5 标准开发规范',
    id: '5'
  },
  {
    name: 'React 开发规范',
    id: '12'
  },
  {
    name: 'Vue 开发规范',
    id: '29'
  },
  {
    name: '微信小程序开发规范',
    id: '21'
  },
  {
    name: 'Rax 标准开发规范',
    id: '1'
  }
];
const promptConfig = [
  {
    type: 'input',
    name: 'accessId',
    message: 'Access ID',
    default: '7YI3Z4afVQxje3cU'
  },
  {
    type: 'list',
    name: 'dslId',
    message: 'Dsl',
    choices: [
      'H5 标准开发规范',
      'React 开发规范',
      'Vue 开发规范',
      '微信小程序开发规范',
      'Rax 标准开发规范'
    ],
    default: '',
    filter: val => {
      let id = '5';
      for (const item of dsl) {
        if (item.name === val) {
          id = item.id;
        }
      }
      return id;
    }
  },
  {
    type: 'checkbox',
    name: 'loaders',
    message: 'Loaders',
    default: ['@imgcook/cli-loader-images'],
    choices: ['@imgcook/cli-loader-images'],
    // filter: val => {
    //   const loaders = [];
    //   for (const item of val) {
    //     loaders.push({
    //       option: {
    //         uploadUrl: ''
    //       },
    //       loader: item,
    //     });
    //   }
    //   return loaders;
    // }
  },
  {
    type: 'list',
    name: 'plugins',
    message: 'Plugin',
    default: ['@imgcook/cli-plugin-generate'],
    choices: ['@imgcook/cli-plugin-generate'],
  }
];

const fse = require('fs-extra');
const { cliConfig } = require('./helper');
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');

const config = async (value, option) => {
  let configData = {};
  if (fse.existsSync(cliConfig.configFile)) {
    configData = await fse.readJson(cliConfig.configFile);
  }
  if (value !== 'set' && !option.set && !option.get) {
    console.log(JSON.stringify(configData, null, 2));
  }
  if (value === 'set') {
    inquirer.prompt(promptConfig).then(async answers => {
      if (!fse.existsSync(`${cliConfig.path}`)) {
        fse.mkdirSync(`${cliConfig.path}`);
      }
      const childProcess = require('child_process');
      const dirname = path.join(__dirname, '../');
      const loaders = answers.loaders;
      if (loaders.length > 0) {
        try {
          for (const item of loaders) {
            childProcess.execSync(`cd ${dirname} && tnpm install ${item}`);
          }
        } catch (error) {
          console.log(chalk.red(error));
        }
      }
      const plugins = answers.plugins;
      if (plugins !== '') {
        try {
          childProcess.execSync(`cd ${dirname} && tnpm install ${plugins}`);
        } catch (error) {
          console.log(chalk.red(error));
        }
      }
      answers.uploadUrl = '';
      await fse.writeFile(
        cliConfig.configFile,
        JSON.stringify(answers, null, 2),
        'utf8'
      );
    });
  }
  if (option.set && value) {
    set(configData, option.set, value);
    await fse.writeFile(
      cliConfig.configFile,
      JSON.stringify(configData, null, 2),
      'utf8'
    );
    if (option.set === 'loaders') {
      const childProcess = require('child_process');
      const dirname = path.join(__dirname, '../');
      childProcess.execSync(`cd ${dirname} && tnpm install ${value}`);
    }
  }
  if (option.get) {
    if (option.get) {
      const value = get(configData, option.get);
      if (option.json) {
        console.log(
          JSON.stringify(
            {
              value
            },
            null,
            2
          )
        );
      } else {
        console.log(value);
      }
    }
  }
};

module.exports = (...args) => {
  return config(...args).catch(err => {
    console.log(chalk.red(err));
  });
};

const get = (target, path) => {
  const fields = path.split('.');
  let obj = target;
  const l = fields.length;
  for (let i = 0; i < l - 1; i++) {
    const key = fields[i];
    if (!obj[key]) {
      return undefined;
    }
    obj = obj[key];
  }
  return obj[fields[l - 1]];
};

const set = function(target, path, value) {
  const fields = path.split('.');
  let obj = target;
  const l = fields.length;
  for (let i = 0; i < l - 1; i++) {
    const key = fields[i];
    if (!obj[key]) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  if (fields[l - 1] === 'loaders') {
    if (obj[fields[l - 1]].length > 0) {
      for (const item of obj[fields[l - 1]]) {
        if (item !== value) {
          obj[fields[l - 1]].push(value);
        }
      }
    } else {
      obj[fields[l - 1]].push(value);
    }
  } else {
    obj[fields[l - 1]] = value;
  }
};
