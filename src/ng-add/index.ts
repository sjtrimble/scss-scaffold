import { 
  Rule,
  SchematicContext,
  Tree,
  apply,
  move,
  mergeWith,
  branchAndMerge,
  template,
  url,
  chain,
  SchematicsException,
  MergeStrategy,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';
import { scssScaffoldOptions } from './schema';

export function setupOptions(host: Tree, options: scssScaffoldOptions): Tree {
  const workspace = getWorkspace(host);
  const workspaceConfig = host.read('angular.json');

  if (!workspaceConfig) {
    throw new SchematicsException("Now at Angular CLI workspace"); 
  }

  if (!options.project) {
    options.project = Object.keys(workspace.projects)[0];
  }

  return host;
}

// Update CLI angular.json file
function updateCLIConfig(options: scssScaffoldOptions, host: Tree) {
  const { getWorkspace, updateWorkspace } = require('@schematics/angular/utility/workspace');
  const workspace = getWorkspace(host);
  const stylesPath = 'src/styles/styles.scss';
  const angularJsonFile = host.read('angular.json');

  if(angularJsonFile) {
    const angularJsonFileObject = JSON.parse(angularJsonFile.toString('utf-8'));
    console.log("angular file object", angularJsonFileObject);
    const project = options.project ? options.project : Object.keys(angularJsonFileObject['projects'])[0];
    const projectObject = angularJsonFileObject.projects[project];
    const styles = projectObject.architect.build.options.styles;

    // Add new styles file path to angular.json styles object
    styles.push(stylesPath);

    console.log("BLARH no need to rerun link");

    // Write back updated angular.json file
    host.overwrite('angular.json', JSON.stringify(angularJsonFileObject, null, "\t"));
  }

  updateWorkspace(workspace);
  return host;

}

export function ngAdd(options: scssScaffoldOptions): Rule {
  return (host: Tree, _context: SchematicContext) => {
    setupOptions(host, options);
    updateCLIConfig(options, host);

    // Rename original SCSS file
    if (host.exists('src/styles.scss')) {
      host.rename('src/styles.scss', 'src/original-styles.scss');
    }

    // Add SCSS folders and files
    const templateSource = apply(url('./files'), [
      template({}),
      move('src')
    ]);

    const rule = chain([
      branchAndMerge(chain([
        mergeWith(templateSource, MergeStrategy.Default)
 ,     ]))
    ]);

    return rule(host, _context);
  }
}
