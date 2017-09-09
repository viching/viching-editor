import {createPackageBuildTasks} from 've-build-tools';
import {vePackage} from './packages';

createPackageBuildTasks(vePackage);

import './tasks/ci';
import './tasks/clean';
import './tasks/default';
import './tasks/development';
import './tasks/docs';
import './tasks/e2e';
import './tasks/lint';
import './tasks/publish';
import './tasks/examples';
import './tasks/unit-test';
import './tasks/aot';
import './tasks/viching-editor-release';
import './tasks/universal';
import './tasks/validate-release';
import './tasks/changelog';
