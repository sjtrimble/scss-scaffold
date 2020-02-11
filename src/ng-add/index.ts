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
} from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
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
function updateCLIConfig(options: scssScaffoldOptions): Rule {
  return (host: Tree) => {
      const CLIConfig = JSON.parse(getFileContent(host, `angular.json`));
      CLIConfig.projects[options.project].architect.build.options.styles = {
          fileReplacements: [
              {
                  "replace": "src/styles.scss",
                  "with": "src/styles/styles.scss"
              }
          ]
      };
      return host;
  }
}

export function ngAdd(options: scssScaffoldOptions): Rule {
  return (host: Tree, _context: SchematicContext) => {
    setupOptions(host, options);
    updateCLIConfig(options);

    // Rename original SCSS file
    if (host.exists('src/styles.scss')) {
      host.rename('src/styles.scss', 'src/original-styles.scss');
    }

    // Add SCSS Folders and Files
    const templateSource = apply(url('./files'), [
      template({}),
      move('src')
    ]);

    const rule = chain([
      branchAndMerge(chain([
        mergeWith(templateSource)
 ,     ]))
    ]);

    return rule(host, _context);
  }
}
