'use babel';

import {CompositeDisposable} from 'atom';
import {basename, extname} from 'path';
import {listSync} from 'fs-plus';
import {default as compareVersions} from 'node-version-compare';

export default {
	packages: [],
	subscriptions: null,

	activate(state) {
		// Events subscribed to in atom’s system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		this.packages = atom.packages.getLoadedPackages();

		// Listen for new packages loaded
		this.subscriptions.add(atom.packages.onDidLoadPackage((pkg) => this.onPackageLoaded(pkg)));
	},

	deactivate() {
		this.subscriptions.dispose();
	},

	onPackageLoaded(newPkg) {
		const oldPkg = this.packages.find(oldPkg => oldPkg.metadata.name === newPkg.metadata.name);
		// Package did not exist on start up or was updated
		if (!oldPkg || compareVersions(oldPkg.metadata.version, newPkg.metadata.version) === -1) {
			const packagePath = atom.packages.resolvePackagePath(newPkg.metadata.name);
			const changelogPath = this.discoverChangelog(packagePath);

			if (changelogPath) {
				this.openMarkdownFile(changelogPath);
			}
		}
	},

	discoverChangelog(packagePath) {
		for (let child of listSync(packagePath)) {
			const fileName = basename(child, extname(child)).toLowerCase();

			if (fileName === 'changelog' || fileName === 'history') {
				return child;
			}
		}
	},

	openMarkdownFile(changelogPath) {
		if (atom.packages.isPackageActive('markdown-preview')) {
			atom.workspace.open(encodeURI(`markdown-preview://${changelogPath}`));
		} else {
			atom.workspace.open(changelogPath);
		}
	}
};
