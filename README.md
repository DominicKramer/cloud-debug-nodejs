# Stackdriver Debugger agent for Node.js

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![devDependency Status][david-dev-image]][david-dev-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

> *This module is experimental, and should be used by early adopters. This module uses APIs that may be undocumented and subject to change without notice.*

This module provides Stackdriver Debugger support for Node.js applications. [Stackdriver Debugger](https://cloud.google.com/tools/cloud-debugger/) is a feature of [Google Cloud Platform](https://cloud.google.com/) that lets you debug your applications in production without stopping or pausing your application. Here's an introductory video:

[![Cloud Debugger Intro](http://img.youtube.com/vi/tyHcK_kAOpw/0.jpg)](https://www.youtube.com/watch?v=tyHcK_kAOpw)

## Prerequisites
* Stackdriver Debugger is comptible with Node.js version 4 or greater. Node.js v5+ is recommended.

## Quick Start
```shell
# Install with `npm` or add to your `package.json`.
npm install --save @google-cloud/debug-agent
```

```js
// Require and start in the startup of your application:
require('@google-cloud/debug-agent').start({ allowExpressions: true });
// No auth necessary if your code is running on Google Cloud Platform.

// ... or, if you are running elsewhere, you can manually provide credentials:
require('@google-cloud/debug-agent').start({
  allowExpressions: true,
  projectId: 'particular-future-12345',
  keyFilename: '/path/to/keyfile.json'
});
```

This starts the automatic Debugger Agent that enables your app to be debuggable using the Stackdriver [Stackdriver Debug view][debug-tab] within
the [Google Cloud Console][dev-console]. You can start adding snapshots and log-points to your application.

## Running on Google Cloud Platform

The Stackdriver Debugger Agent should work without manually provided authentication credentials for instances running on Google Cloud Platform, as long as the [Stackdriver Debugger API][debugger-api] access scope is enabled on that instance.

For **Google App Engine** instances, this is the enabled by default.

On **Google Container Engine (GKE)**, you need to explicitly add the `cloud_debugger` OAuth scope when creating the cluster:

```
$ gcloud container clusters create example-cluster-name --scopes https://www.googleapis.com/auth/cloud_debugger
```

For **Google Compute Engine instances**, you need to explicitly enable the Debugger API access scope for each instance. When creating a new instance through the GCP web console, you can do this in one of two ways under **Identity and API access**:
* Use the Compute Engine default service account and select "Allow full access to all Cloud APIs" under Access scopes.
* Select a service account with the [**Cloud Debugger Agent**][debugger-roles] role, which contains the necessary permissions (or any other role with at least the same permissions). You may need to create one if you don't have one already.

You may add the Stackdriver Debugger API access scope to existing Compute instances if they are running as a non-default service account by adding the Cloud Debugger Agent role to the service account. For more information, see the docs for [Creating and Enabling Service Accounts for Instances][service-account-docs].

## Running elsewhere

If your application is running outside of Google Cloud Platform, such as locally, on-premise, or on another cloud provider, you can still use Stackdriver Debugger.

1. You will need to specify your project name. Your project name is visible in the [Google Cloud Console][cloud-console-projects], it may be something like `particular-future-12345`. If your application is [running on Google Cloud Platform](running-on-google-cloud-platform), you don't need to specify the project name. You can specify this either in the module options, or through an environment variable:

    ```JS
      // In your app:
      var debug = require('@google-cloud/debug-agent').start({
        allowExpressions: true,
        projectId: 'particular-future-12345',
        keyFilename: '/path/to/keyfile.json'
      });
    ```

    ```BASH
      # Or in Bash:
      export GCLOUD_PROJECT='particular-future-12345'
    ```

1. You need to provide service account credentials to your application.
  * The recommended way is via [Application Default Credentials][app-default-credentials].
    1. [Create a new JSON service account key][service-account].
    1. Copy the key somewhere your application can access it. Be sure not to expose the key publicly.
    1. Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the full path to the key. The debug agent will automatically look for this environment variable.
  * If you are running your application on a machine where your are using the [`gcloud` command line tools][gcloud-sdk], and are logged using `gcloud auth login`, you already have sufficient credentials, and a service account key is not required.
  * Alternatively, you may set the keyFilename or credentials configuration field to the full path or contents to the key file, respectively. Setting either of these fields will override either setting GOOGLE_APPLICATION_CREDENTIALS or logging in using gcloud. For example:

    ```js
    // Require and start the agent with configuration options
    require('@google-cloud/debug-agent').start({
      // Allow the evaluation of watch expressions and snapshot conditions:
      allowExpressions: true,

      // The path to your key file:
      keyFilename: '/path/to/keyfile.json',

      // Or the contents of the key file:
      credentials: require('./path/to/keyfile.json')
    });
    ```

   See the [configuration object][configuration-object] for more details.

1. Generate a `source-context.json` file which contains information about the version of the source code used to build the application. This file should be located in the root directory of your application. When you open the Stackdriver Debugger in the Cloud Platform Console, it uses the information in this file to display the correct version of the source.

        gcloud beta debug source gen-repo-info-file

## Debugger Agent Settings

You can customize the behaviour of the automatic debugger agent. See [the agent configuration][config-js] for a list of possible configuration options. These options can be passed in the `options` object passed to the `start` function.

```JS
  require('@google-cloud/debug-agent').start({
    // .. auth settings ..

    // debug agent settings:
    allowExpressions: true,
    serviceContext: {
        service: 'my-service',
        version: 'version-1'
    },
    capture: { maxFrames: 20, maxProperties: 100 }
  });
 ```

## Using the Debugger

Once your application is running (deployed, or elsewhere), you should be able to use the [Debug UI][debug-tab] in your Cloud [developer console][dev-console]. You can find the Debug UI in the 'STACKDRIVER -> Debug' section in the navigation panel, or by simply searching for 'Debug' in the cloud console.

![Debug UI](doc/images/debug-ui.png?raw=true)

If your source is hosted in a [cloud source repository](https://cloud.google.com/tools/cloud-repositories/docs/), Stackdriver Debugger will display the source code of your application automatically. Alternatively, you can also point the debugger to local files, a GitHub or Bitbucket repository, through a Source Capture, or you can simply type in a filename and line number. More details are on source options are [available here](https://cloud.google.com/debugger/docs/source-options).

If you have the source available, you can set a snapshot by clicking in the gutter (line number area). Once you set a snapshot, the debug agent will insert a momentary breakpoint at the code location in the running instances of the application.

![Breakpoint Set](doc/images/breakpoint-set.png?raw=true)

As soon as that line of code is reached in any of the running instances of your application, the stack traces, local variables, and watch expressions are captured, and your application continues.

![Breakpoint Hit](doc/images/breakpoint-hit.png?raw=true)

Note that the directory layout of the code that is being debugged does not have to exactly match the source code specified in the Debug UI.  In particular, if a snapshot is specified in a file in the Debug UI, a breakpoint is set in the deployed file with the longest matching path suffix.

An example will help illustrate this.  That is, suppose that the code on the running instance is structured as follows:
```
/running/instance/package.json
/running/instance/main.js
/running/instance/a/index.js
/running/instance/b/a/index.js
```
Now suppose on your local machine you have a copy of the code as follows, and you have selected the `/local/machine` directory in the Debug UI as the directory containing the code to debug.
```
/local/machine/package.json
/local/machine/main.js
/local/machine/a/index.js
/local/machine/b/a/index.js
```

In this case, if you specify a snapshot in file `/local/machine/b/a/index.js` in the Debug UI, the debugger will identify that that file corresponds to the file `/running/instance/b/a/index.js` of the code on the running instance, and the breakpoint will hit when the specified line of `/running/instance/b/a/index.js` is reached.

Note, however, if a snapshot is specified for the file `/local/machine/a/index.js` in the Debug UI, then the debugger would not know whether this file corresponds to the file `/running/instance/a/index.js` or `/running/instance/b/a/index.js`.  If such an ambiguity occurs, a message will be displayed in the Debug UI.

In this case, the `appPathRelativeToRepository` configuration option can be used to specify the directory containing the application's `package.json` file to help resolve the ambiguity.  In the example above, if the `appPathRelativeToRepository` configuration option is set to `/local/machine`, the debugger would be able to identify `/running/instance/a/index.js` as the file where the breakpoint should be set.  See the [Debugger Agent Settings](#debugger-agent-settings) section for more information on configuring the debugger.

## Support for Transpiled Code

The debugger supports the use of transpiled code, whether it be Javascript to Javascript transpilation or transpilation from another language (such as Typescript) to Javascript.  In order to use transpiled code with the debugger, sourcemaps need to be generated with the transpiled code.  The sourcemaps need to be provided in `.js.map` files.

To use the debugger, the only files that are needed in the deployment environment are the transpiled files as well as the generated sourcemap files.  In particular, the original source does not need to be available to the debugger in the deployment environment.

Instead, the original source code is provided to the Debug UI to specify snapshots.  When specifying a snapshot in an original source file in the Debug UI, the corresponding file and line in the transpiled code is automatically determined based on the sourcemap files provided with the transpiled code at runtime.  See the [Using the Debugger](#using-the-debugger) section for more information about using the Debug UI.  In addition, the exact directory layout of the original source is somewhat flexible, just as it is with the use of non-transpiled code as described in the [Using the Debugger](#using-the-debugger) section.

## Limitations and Requirements
* The root directory of your application needs to contain a `package.json` file.
* You can set snapshot conditions and watch expressions to be evaluated in the context of your application. This leads to some issues you should be aware of
  * You may be able to view sensitive data of your own users by looking at the values of the variables.
  * The debug agent tries to ensure that all conditions and watchpoints you add are read-only and have no side effects. It catches, and disallows, all expressions that may have static side effects to prevent accidental state change. However, it presently does not catch expressions that have dynamic side-effects. For example, `o.f` looks like a property access, but dynamically, it may end up calling a getter function. We presently do NOT detect such dynamic-side effects.
* With Node.js 4.x and older, your application may experience a performance impact when there are snapshots active. There should be no impact to performance when no snapshots are active. Node.js v5.x does not have this issue.
* Node.js v0.10.x or older are not supported as they lack some necessary APIs to avoid a permanent (life of the application) performance hit.


[cloud-debugger]: https://cloud.google.com/tools/cloud-debugger/
[dev-console]: https://console.cloud.google.com/
[debug-tab]: https://console.cloud.google.com/debug
[gcloud-sdk]: https://cloud.google.com/sdk/gcloud/
[cloud-console-projects]: https://console.cloud.google.com/iam-admin/projects
[app-default-credentials]: https://cloud.google.com/identity/protocols/application-default-credentials
[service-account]: https://console.cloud.google.com/apis/credentials/serviceaccountkey
[service-account-docs]: https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances
[debugger-roles]: https://cloud.google.com/debugger/docs/iam#roles
[npm-image]: https://img.shields.io/npm/v/@google-cloud/debug-agent.svg
[npm-url]: https://npmjs.org/package/@google-cloud/debug-agent
[travis-image]: https://travis-ci.org/GoogleCloudPlatform/cloud-debug-nodejs.svg?branch=master
[travis-url]: https://travis-ci.org/GoogleCloudPlatform/cloud-debug-nodejs
[coveralls-image]: https://img.shields.io/coveralls/GoogleCloudPlatform/cloud-debug-nodejs/master.svg
[coveralls-url]: https://coveralls.io/r/GoogleCloudPlatform/cloud-debug-nodejs?branch=master
[david-image]: https://david-dm.org/GoogleCloudPlatform/cloud-debug-nodejs.svg
[david-url]: https://david-dm.org/GoogleCloudPlatform/cloud-debug-nodejs
[david-dev-image]: https://david-dm.org/GoogleCloudPlatform/cloud-debug-nodejs/dev-status.svg
[david-dev-url]: https://david-dm.org/GoogleCloudPlatform/cloud-debug-nodejs?type=dev
[debugger-api]: https://console.cloud.google.com/apis/api/clouddebugger.googleapis.com/overview
[snyk-image]: https://snyk.io/test/github/GoogleCloudPlatform/cloud-debug-nodejs/badge.svg
[snyk-url]: https://snyk.io/test/github/GoogleCloudPlatform/cloud-debug-nodejs
[config-js]: https://github.com/GoogleCloudPlatform/cloud-debug-nodejs/blob/master/src/agent/config.js
[configuration-object]: https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/0.45.0/google-cloud
