import {BuildPackage, buildConfig} from 've-build-tools';
import {join} from 'path';

export const vePackage = new BuildPackage('viching-editor');

// To avoid refactoring of the project the material package will map to the source path `lib/`.
vePackage.packageRoot = join(buildConfig.packagesDir, 'lib');
