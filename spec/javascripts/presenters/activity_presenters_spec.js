describe("chorus.presenters.Activity", function() {
    var model, actor, presenter, workfile, workspace, dataset, member,
        sourceDataset, gnipDataSource, datasetModel, schema, destination;

    function linkTo(url, text) {
        return Handlebars.helpers.linkTo(url, text);
    }

    function itHasTheActorIcon() {
        describe("the icon", function() {
            it("shows the user's icon", function() {
                expect(presenter.iconSrc()).toBe(actor.fetchImageUrl({ size: "icon" }));
            });

            it("links to the user's profile", function() {
                expect(presenter.iconHref()).toBe(actor.showUrl());
            });

            it("has the class 'profile'", function() {
                expect(presenter.iconClass()).toBe("profile");
            });
        });
    }

    function itHasTheErrorIcon() {
        describe("the icon", function() {
            it("shows the error icon", function() {
                expect(presenter.iconSrc()).toBe("/images/message_error.png");
            });

            it("links to the user's profile", function() {
                expect(presenter.iconHref()).toBeNull();
            });

            it("has the class 'profile'", function() {
                expect(presenter.iconClass()).toBe("error");
            });
        });
    }

    function itHasTheImportIcon() {
        describe("the icon", function() {
            it("shows the error icon", function() {
                expect(presenter.iconSrc()).toBe("/images/import_icon.png");
            });

            it("links to dataset", function() {
                expect(presenter.iconHref()).toBe(dataset.showUrl());
            });

            it("has the class 'profile'", function() {
                expect(presenter.iconClass()).toBe("icon");
            });
        });
    }

    describe("common aspects", function() {
        context("activity with a workspace", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.workfileCreated();
                workfile = model.workfile();
                workspace = model.workspace();
                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
            });

            it("includes the relative timestamp", function() {
                var relativeTime = Handlebars.helpers.relativeTimestamp(model.get("timestamp"));
                expect(presenter.timestamp()).toBe(relativeTime);
            });

            describe("#headerHtml", function() {
                it("returns the translation for the first style that matches", function() {
                    presenter.options.displayStyle = ["without_object", "without_workspace"];
                    expect(presenter.headerHtml().toString()).toContainTranslation(
                        "activity.header.WorkfileCreated.without_workspace", {
                            actorLink: linkTo(actor.showUrl(), actor.name()),
                            workfileLink: linkTo(workfile.showUrl(), workfile.name())
                        }
                    );
                });

                it("returns the translation for the default style if no style is provided " +
                    "and the model has a valid workspace", function() {
                    presenter.options.displayStyle = null;
                    expect(presenter.headerHtml().toString()).toContainTranslation(
                        "activity.header.WorkfileCreated.default", {
                            actorLink: linkTo(actor.showUrl(), actor.name()),
                            workfileLink: linkTo(workfile.showUrl(), workfile.name()),
                            workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                        }
                    );
                });

                it("returns a handlebars safe-string (so that html won't be stripped)", function() {
                    expect(presenter.headerHtml()).toBeA(Handlebars.SafeString);
                });
            });
        });

        context("activity without a workspace", function() {
            var noteObject;

            beforeEach(function() {
                model = rspecFixtures.activity.noteOnGreenplumDataSource();
                noteObject = model.dataSource();
                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
            });

            describe("#headerHtml", function() {
                it("returns the translation for the without_workspace style if no style is provided " +
                    "and the model does not have a valid workspace", function() {
                    presenter.options.displayStyle = null;
                    expect(presenter.headerHtml().toString()).toContainTranslation(
                        "activity.header.NOTE.without_workspace", {
                            actorLink: linkTo(actor.showUrl(), actor.name()),
                            noteObjectLink: linkTo(noteObject.showUrl(), noteObject.name()),
                            noteObjectType: "data source"
                        }
                    );
                });
            });
        });

        describe("#canDelete", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.noteOnGreenplumDataSource();
                presenter = new chorus.presenters.Activity(model);
            });

            context("User is admin", function() {
                it("returns true", function() {
                    setLoggedInUser({ admin: true });
                    expect(presenter.canDelete()).toBeTruthy();
                });
            });

            context ("user is owner of the note" , function() {
                it("returns true", function() {
                    setLoggedInUser({ admin: false, id: model.actor().id });
                    expect(presenter.canDelete()).toBeTruthy();
                });
            });

            context ("user is neither owner or admin" , function() {
                it("returns false", function() {
                    setLoggedInUser({ admin: false });
                    expect(presenter.canDelete()).toBeFalsy();
                });
            });
        });

        describe("#canEdit", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.noteOnGreenplumDataSource();
                presenter = new chorus.presenters.Activity(model);
            });

            context ("user is owner of the note" , function() {
                it("returns true", function() {
                    setLoggedInUser({ id: model.actor().id });
                    expect(presenter.canEdit()).toBeTruthy();
                });
            });

            context ("user is not the owner" , function() {
                it("returns false", function() {
                    setLoggedInUser({ id: 12341324 });
                    expect(presenter.canEdit()).toBeFalsy();
                });
            });
        });

        describe("#isNote", function() {
            context ("when it is a note" , function() {
                beforeEach(function() {
                    model = rspecFixtures.activity.noteOnGreenplumDataSource();
                    presenter = new chorus.presenters.Activity(model);
                });
                it("returns true", function() {
                    setLoggedInUser({ id: model.actor().id });
                    expect(presenter.isNote()).toBeTruthy();
                });
            });

            context ("when it is a not a note" , function() {
                beforeEach(function() {
                    model = rspecFixtures.activity.dataSourceCreated();
                    presenter = new chorus.presenters.Activity(model);
                });
                it("returns false", function() {
                    setLoggedInUser({ id: model.actor().id });
                    expect(presenter.isNote()).toBeFalsy();
                });
            });
        });

        describe("isNotification and isReadOnly", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.noteOnGreenplumDataSource();
                var presenter_options = {
                    isNotification: true,
                    isReadOnly: true
                };
                presenter = new chorus.presenters.Activity(model, presenter_options);
            });
            it('when isNotification is true', function() {
                expect(presenter.isNotification()).toEqual(true);
            });
            it('when isReadOnly is true', function() {
                expect(presenter.isReadOnly()).toEqual(true);
            });
        });
    });

    describe("#promotionDetails", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.insightOnGreenplumDataSource();
            var presenter_options = {
            };
            presenter = new chorus.presenters.Activity(model, presenter_options);
        });
        it('shows the promoting user and the promotion timestamp', function() {
            expect(presenter.promotionDetails().toString()).toContainTranslation(
                "insight.promoted_by", {
                    relativeTimestamp: model.promotionTimestamp(),
                    promoterLink:model.promoterLink()
                }
            );
        });
    });

    describe("#isPublished", function() {

        context(" when insight is published", function () {
            beforeEach(function () {
                model = rspecFixtures.activity.insightOnGreenplumDataSource({
                    isPublished:true
                });
                var presenter_options = {

                };
                presenter = new chorus.presenters.Activity(model, presenter_options);
            });

            it('when isPublished is true', function () {
                expect(presenter.isPublished()).toBeTruthy();

            });
        });

        context(" when insight is Not published", function () {
            beforeEach(function () {
                model = rspecFixtures.activity.insightOnGreenplumDataSource({
                    isPublished:false
                });
                var presenter_options = {
                };
                presenter = new chorus.presenters.Activity(model, presenter_options);
            });

            it('when isPublished is false', function () {
                expect(presenter.isPublished()).toBeFalsy();

            });
        });
    });

    context("data source created", function() {
        var dataSource;

        beforeEach(function() {
            model = rspecFixtures.activity.dataSourceCreated();
            presenter = new chorus.presenters.Activity(model);
            dataSource = model.dataSource();
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toContainTranslation(
                "activity.header.DataSourceCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    dataSourceLink: linkTo(dataSource.showUrl(), dataSource.name())
                }
            );
        });
    });

    context('hadoop data source created', function() {
        var hdfsDataSource;

        beforeEach(function() {
            model = rspecFixtures.activity.hdfsDataSourceCreated();
            presenter = new chorus.presenters.Activity(model);
            hdfsDataSource = model.hdfsDataSource();
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toContainTranslation(
                "activity.header.HdfsDataSourceCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    hdfsDataSourceLink: linkTo(hdfsDataSource.showUrl(), hdfsDataSource.name())
                }
            );
        });
    });

    context('gnip data source created', function() {
        beforeEach(function() {
            model = rspecFixtures.activity.gnipDataSourceCreated();
            presenter = new chorus.presenters.Activity(model);
            gnipDataSource = model.gnipDataSource();
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toContainTranslation(
                "activity.header.GnipDataSourceCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    gnipDataSourceLink: linkTo(gnipDataSource.showUrl(), gnipDataSource.name())
                }
            );
        });
    });

    context('relational data source changed owner', function() {
        var dataSource, newOwner;

        beforeEach(function() {
            model = rspecFixtures.activity.dataSourceChangedOwner();
            presenter = new chorus.presenters.Activity(model);
            dataSource = model.dataSource();
            newOwner = model.newOwner();
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toContainTranslation(
                "activity.header.DataSourceChangedOwner.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    dataSourceLink: linkTo(dataSource.showUrl(), dataSource.name()),
                    newOwnerLink: linkTo(newOwner.showUrl(), newOwner.name())
                }
            );
        });
    });

    context('relational data source changed name', function() {
        var dataSource;

        beforeEach(function() {
            model = rspecFixtures.activity.dataSourceChangedName({
                newName: "jane",
                oldName: "john"
            });
            presenter = new chorus.presenters.Activity(model);
            dataSource = model.dataSource();
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toContainTranslation(
                "activity.header.DataSourceChangedName.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    dataSourceLink: linkTo(dataSource.showUrl(), dataSource.name()),
                    newName: "jane",
                    oldName: "john"
                }
            );
        });
    });

    context('hadoop data source changed name', function() {
        var instance;

        beforeEach(function() {
            model = rspecFixtures.activity.hdfsDataSourceChangedName({
                newName: "jane",
                oldName: "john"
            });
            presenter = new chorus.presenters.Activity(model);
            instance = model.hdfsDataSource();
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toContainTranslation(
                "activity.header.HdfsDataSourceChangedName.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    hdfsDataSourceLink: linkTo(instance.showUrl(), instance.name()),
                    newName: "jane",
                    oldName: "john"
                }
            );
        });
    });

    context("public workspace created", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.publicWorkspaceCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.PublicWorkspaceCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("private workspace created", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.privateWorkspaceCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.PublicWorkspaceCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("workspace made public", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceMakePublic();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceMakePublic.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("workspace made private", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceMakePrivate();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceMakePrivate.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("workspace archived", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceArchived();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceArchived.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });

    });

    context("workspace deleted", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceDeleted({
                workspace :{
                    id: 1,
                    name: "abc",
                    isDeleted: true
                }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceDeleted.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });

    });

    context("workspace unarchived", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceUnarchived();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceUnarchived.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });

    });

    context("workfile created", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workfileCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workfile = model.workfile();
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkfileCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workfileLink: linkTo(workfile.showUrl(), workfile.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("workfile upgrade version", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workfileUpgradedVersion();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workfile = model.workfile();
            var workspace = workfile.workspace();
            var workfile_version = new chorus.models.Workfile({
                versionInfo: { id : model.get("versionId") },
                id : workfile.id,
                workspace: workspace
            });

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkfileUpgradedVersion.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workfileLink: linkTo(workfile.showUrl(), workfile.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    versionLink: linkTo(workfile_version.showUrl(), t("workfile.version_title", { versionNum: model.get("versionNum") }))
                }
            );
        });
    });

    context("workfile version deleted", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workfileVersionDeleted();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workfile = model.workfile();
            var workspace = workfile.workspace();
            var workfile_version = new chorus.models.Workfile({
                versionInfo: { id : model.get("versionId") },
                id : workfile.id,
                workspace: workspace
            });

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkfileVersionDeleted.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workfileLink: linkTo(workfile.showUrl(), workfile.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    versionNum: model.get("versionNum")
                }
            );
        });
    });

    context("source table created", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.sourceTableCreated({ dataset: { objectType: "VIEW" } });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            dataset = model.dataset();
            workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.SourceTableCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    datasetType: t("dataset.entitySubtypes.view")
                }
            );
        });
    });

    context("sandbox added", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.sandboxAdded();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            var workspace = model.workspace();

            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceAddSandbox.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("add a hdfs file as external table", function() {
        var hdfsEntry;

        beforeEach(function() {
            model = rspecFixtures.activity.hdfsFileExtTableCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            hdfsEntry = model.hdfsEntry();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.HdfsFileExtTableCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    hdfsEntryLink: linkTo(hdfsEntry.showUrl(), hdfsEntry.name()),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name())
                }
            );
        });
    });

    context("add a hdfs directory as external table", function() {
        var hdfsEntry;

        beforeEach(function() {
            model = rspecFixtures.activity.hdfsDirectoryExtTableCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            hdfsEntry = model.hdfsEntry();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.HdfsDirectoryExtTableCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    hdfsEntryLink: linkTo(hdfsEntry.showUrl(), hdfsEntry.name()),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name())
                }
            );
        });
    });

    context("add a hdfs directory as external table with file pattern", function() {
        var hdfsEntry;

        beforeEach(function() {
            model = rspecFixtures.activity.hdfsPatternExtTableCreated({filePattern: '*.csv'});
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            hdfsEntry = model.hdfsEntry();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.HdfsPatternExtTableCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    hdfsEntryLink: linkTo(hdfsEntry.showUrl(), hdfsEntry.name()),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    filePattern: '*.csv'
                }
            );
        });
    });

    context("file import success", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.fileImportSuccess();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
        });

        itHasTheImportIcon();

        it("has the right header html", function() {
            presenter.options.displayStyle = ["without_workspace"];
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.FileImportSuccess.default", {
                    importType: model.get("importType"),
                    importSourceLink: model.get("fileName"),
                    datasetType: t("dataset.entitySubtypes.table"),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("workspace import success", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceImportSuccess();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            sourceDataset = model.importSource();
        });

        itHasTheImportIcon();

        it("has the right header html", function() {
            presenter.options.displayStyle = ["without_workspace"];
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceImportSuccess.default", {
                    importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                    datasetType: t("dataset.entitySubtypes.table"),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context('schema import created', function(){

        beforeEach(function() {
            model = rspecFixtures.activity.schemaImportCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            schema = model.schema();
            destination = model.dataset();
            sourceDataset = new chorus.models.Dataset(model.get('sourceDataset'));
        });

        itHasTheActorIcon();

        context("after the destination dataset exists", function(){
            beforeEach(function(){
                destination = rspecFixtures.dataset();
                model = rspecFixtures.activity.schemaImportCreated({dataset: destination});
                presenter = new chorus.presenters.Activity(model);
            });

            it("has the right header html", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.SchemaImportCreated.default", {
                        actorLink: linkTo(actor.showUrl(), actor.name()),
                        sourceDatasetInSchemaLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                        destObjectOrNameInSchema: linkTo(destination.showUrl(), destination.name()),
                        datasetType: t("dataset.entitySubtypes.table"),
                        schemaLink: linkTo(schema.showUrl(), schema.name())
                    }
                );
            });
        });

        context("before the destination dataset exists", function(){
            it("has the right header html", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.SchemaImportCreated.default", {
                        actorLink: linkTo(actor.showUrl(), actor.name()),
                        sourceDatasetInSchemaLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                        datasetType: t("dataset.entitySubtypes.table"),
                        destObjectOrNameInSchema: model.get('destinationTable'),
                        schemaLink: linkTo(schema.showUrl(), schema.name())
                    }
                );
            });
        });

    });

    context('schema import success', function(){
        beforeEach(function() {
            model = rspecFixtures.activity.schemaImportSuccess();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            schema = model.dataset().schema();
            dataset = model.dataset();
            sourceDataset = model.importSource();
        });

        itHasTheImportIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.SchemaImportSuccess.default", {
                    sourceDatasetInSchemaLink: (new chorus.models.Dataset(sourceDataset.attributes)).showLink(),
                    destinationDatasetInSchemaLink: (new chorus.models.Dataset(dataset.attributes)).showLink(),
                    destinationSchemaLink: dataset.schema().showLink()
                }
            );
        });
    });

    context('schema import failed', function(){
        beforeEach(function() {
            model = rspecFixtures.activity.schemaImportFailed();
            actor = model.actor();
            sourceDataset = model.importSource();

        });

        itHasTheImportIcon();

        context("when the events has a dataset", function() {
            beforeEach(function() {
                dataset = model.dataset();
                presenter = new chorus.presenters.Activity(model);
            });

            it("has the right header html", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.SchemaImportFailed.default", {
                        sourceDatasetInSchemaLink: (new chorus.models.Dataset(sourceDataset.attributes)).showLink(),
                        destinationSchemaLink: dataset.schema().showLink(),
                        destObjectOrNameInSchema: (new chorus.models.Dataset(dataset.attributes)).showLink()
                    }
                );
            });
        });

        context("when the events does not have a dataset", function() {
            beforeEach(function() {
                delete model.attributes.dataset;
                presenter = new chorus.presenters.Activity(model);
            });

            it("has the right header html", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.SchemaImportFailed.default", {
                        sourceDatasetInSchemaLink: (new chorus.models.Dataset(sourceDataset.attributes)).showLink(),
                        destinationSchemaLink: (new chorus.models.Schema(model.get('schema'))).showLink(),
                        destObjectOrNameInSchema: model.get('destinationTable')
                    }
                );
            });
        });
    });

    context("file import failed", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.fileImportFailed();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
        });

        itHasTheErrorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.FileImportFailed.default", {
                    importType: model.get("importType"),
                    importSourceLink: model.get("fileName"),
                    datasetType: t("dataset.entitySubtypes.table"),
                    destObjectOrName: model.get('destinationTable'),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });

        it("has the error link", function() {
            expect(presenter.isFailure()).toBe(true);
        });
    });

    context("dataset import failed", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceImportFailed();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            sourceDataset = model.importSource();
        });

        itHasTheErrorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceImportFailed.default", {
                    importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                    datasetType: t("dataset.entitySubtypes.table"),
                    destObjectOrName: model.get('destinationTable'),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("note on a hdfs file", function() {
        var hdfsFile;

        beforeEach(function() {
            model = rspecFixtures.activity.noteOnHdfsFileCreated({
                hdfsFile: { isDir: false, id: 4567, name: "path.csv", hdfsDataSource: {id: 1234}}
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            hdfsFile = rspecFixtures.hdfsDir({
                id: 4567,
                hdfsDataSource: { id: 1234 },
                name: "path.csv",
                isDir: false
            });
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.without_workspace", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(hdfsFile.showUrl(), hdfsFile.name()),
                    noteObjectType: "file"
                }
            );
        });
    });

    context('note on a gpdb data source', function() {
        var instance;

        beforeEach(function() {
            model = rspecFixtures.activity.noteOnGreenplumDataSource({
                dataSource: {
                    id: 42,
                    name: 'my_instance'
                }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            instance = rspecFixtures.gpdbDataSource({id: 42, name: 'my_instance'});
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.without_workspace", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(instance.showUrl(), instance.name()),
                    noteObjectType: "data source"
                }
            );
        });
    });

    context('note on a gnip data source', function() {
        var instance;
        beforeEach(function() {
            model = rspecFixtures.activity.noteOnGnipDataSourceCreated({
                gnipDataSource: {
                    id: 42,
                    name: 'my_gnip_data_source'
                }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            instance = rspecFixtures.gnipDataSource({id: 42, name: 'my_gnip_data_source'});
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.without_workspace", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(instance.showUrl(), instance.name()),
                    noteObjectType: "data source"
                }
            );
        });
    });

    context("note on a workspace ", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.noteOnWorkspaceCreated({
                workspace: {
                    name: 'le_workspace',
                    id: 42
                }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = rspecFixtures.workspace({id: 42, name: 'le_workspace' });
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.without_workspace", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(workspace.showUrl(), workspace.name()),
                    noteObjectType: "workspace"
                }
            );
        });
    });

    context('note on a hadoop data source', function() {
        var instance;

        beforeEach(function() {
            model = rspecFixtures.activity.noteOnHdfsDataSourceCreated({
                hdfsDataSource: {
                    id: 42,
                    name: 'my_instance'
                }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            instance = rspecFixtures.hdfsDataSource({id: 42, name: 'my_instance'});
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.without_workspace", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(instance.showUrl(), instance.name()),
                    noteObjectType: "data source"
                }
            );
        });
    });

    context("note on a dataset", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.noteOnDatasetCreated({
                dataset: { id: 42, objectName: "lunch_boxes" }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            dataset = model.noteObject();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.without_workspace", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(dataset.showUrl(), dataset.name()),
                    noteObjectType: t("dataset.entitySubtypes.table")
                }
            );
        });
    });

    context("note on a workspace dataset", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.noteOnWorkspaceDatasetCreated({
                dataset: { id: 42, objectName: "lunch_boxes" },
                workspace: { id: 55, name: "paleo_eaters" }
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            dataset = model.noteObject();
            workspace = model.workspace();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.NOTE.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    noteObjectLink: linkTo(dataset.showUrl(), dataset.name()),
                    noteObjectType: t("dataset.entitySubtypes.table"),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });

    context("workspace name change", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.workspaceChangeName({
                workspace: { id: 55, name: "paleo_eaters" },
                workspaceOldName: "old_name"
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.WorkspaceChangeName.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                    workspaceOldName: model.get("workspaceOldName")
                }
            );
        });
    });

    context("members added event", function() {
        var activity_data, activity_without_workspace_data;
        beforeEach(function() {
            model = rspecFixtures.activity.membersAdded({
                workspace: { id: 55, name: "paleo_eaters" },
                member: { id: 66, firstName: "Susie", lastName: "Cupcake"}
            });
            actor = model.actor();
            workspace = model.workspace();
            member = model.member();

            activity_data = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                memberLink: linkTo(member.showUrl(), member.name())
            };
            activity_without_workspace_data = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                memberLink: linkTo(member.showUrl(), member.name())
            };
        });

        context("the actor icon is displayed", function () {
            beforeEach(function() {
                presenter = new chorus.presenters.Activity(model);
            });
            itHasTheActorIcon();
        });

        context("a single member is added", function() {
            beforeEach(function () {
                model.set({numAdded: "1"});
                presenter = new chorus.presenters.Activity(model);
            });

            it("has the right header html for the default style", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.one.default",
                    activity_data
                );
            });

            it("has the right header html for the without_workspace style", function() {
                presenter.options.displayStyle = ["without_workspace"];

                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.one.without_workspace",
                    activity_without_workspace_data
                );
            });
        });

        context("two members are added", function() {
            beforeEach(function () {
                model.set({numAdded: "2"});
                presenter = new chorus.presenters.Activity(model);
            });

            it("has the right header html for the default style", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.two.default",
                    activity_data
                );
            });

            it("has the right header html for the without_workspace style", function() {
                presenter.options.displayStyle = ["without_workspace"];

                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.two.without_workspace",
                    activity_without_workspace_data
                );
            });

            it("choose right header for notification if isNotification is set to true", function() {
                presenter.options.isNotification = true;
                presenter.options.displayStyle = ['default'];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.notification.default",
                    activity_data
                );
            });
        });

        context("more than two members are added", function() {
            beforeEach(function () {
                model.set({numAdded: "5"});
                presenter = new chorus.presenters.Activity(model);
            });

            it("has the right header html for the default style", function() {
                activity_data["count"] = model.get("numAdded");
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.many.default",
                    activity_data
                );
            });

            it("has the right header html for the without_workspace style", function() {
                presenter.options.displayStyle = ["without_workspace"];
                activity_without_workspace_data["count"] = model.get("numAdded");
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.MembersAdded.many.without_workspace",
                        activity_without_workspace_data
                );
            });
        });
    });

    context("file import created event", function() {
        var activity_data;
        beforeEach(function () {
            model = rspecFixtures.activity.fileImportCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();

            activity_data = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                importType: model.get("importType"),
                importSourceLink: model.get("fileName"),
                datasetType: t("dataset.entitySubtypes.table"),
                destObjectOrName: "table"
            };
        });
        context("when called with a FILE_IMPORT_CREATED event", function () {
            it("blank out the without_workspace style and use default instead", function () {
                presenter.options.displayStyle = ["without_workspace"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.FileImportCreated.default",
                    activity_data
                );
            });
            context("when importing to a new table", function () {
                it("displays the destination table name without link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.FileImportCreated.default",
                        activity_data
                    );
                });
            });
            context("when importing to an existing table", function () {
                beforeEach(function () {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.fileImportCreated({dataset: datasetModel});
                    dataset = model.dataset();
                    activity_data["destObjectOrName"] = linkTo(dataset.showUrl(), dataset.name());
                    presenter = new chorus.presenters.Activity(model);
                });
                it("displays the destination table name with dataset link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.FileImportCreated.default",
                        activity_data
                    );
                });
            });
        });
    });

    context("gnip import created event", function() {
        context("when dataset does not yet exist", function() {
            var activity_data;
            beforeEach(function () {
                model = rspecFixtures.activity.gnipStreamImportCreated();
                dataset = rspecFixtures.dataset();
                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
                gnipDataSource = model.gnipDataSource();

                activity_data = {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    gnipDataSourceLink: linkTo(gnipDataSource.showUrl(), gnipDataSource.name()),
                    destObjectOrName: model.get('destinationTable')
                };
            });

            it("has the right header html", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.GnipStreamImportCreated.default",
                    activity_data
                );
            });
        });

        context("when dataset exists", function() {
            var activity_data;
            beforeEach(function () {
                model = rspecFixtures.activity.gnipStreamImportCreated();
                dataset = rspecFixtures.dataset();
                dataset.set({ workspace: model.get('workspace') });
                var workspaceDataset = new chorus.models.WorkspaceDataset(dataset);
                model.set({ dataset: dataset });

                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
                gnipDataSource = model.gnipDataSource();

                activity_data = {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    destObjectOrName: linkTo(workspaceDataset.showUrl(), workspaceDataset.name()),
                    gnipDataSourceLink: linkTo(gnipDataSource.showUrl(), gnipDataSource.name())
                };
            });

            it("has the right header html", function() {
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.GnipStreamImportCreated.default",
                    activity_data
                );
            });
        });
    });

    context("gnip import success event", function() {
        var activity_data;
        beforeEach(function () {
            model = rspecFixtures.activity.gnipStreamImportSuccess();
            presenter = new chorus.presenters.Activity(model);
            workspace = model.workspace();
            dataset = model.dataset();
            gnipDataSource = model.gnipDataSource();

            activity_data = {
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                gnipDataSourceLink: linkTo(gnipDataSource.showUrl(), gnipDataSource.name())
            };
        });

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.GnipStreamImportSuccess.default",
                activity_data
            );
        });
    });

    context("gnip import failure event", function() {
        var activity_data;
        beforeEach(function () {
            model = rspecFixtures.activity.gnipStreamImportFailed();
            presenter = new chorus.presenters.Activity(model);
            workspace = model.workspace();
            gnipDataSource = model.gnipDataSource();

            activity_data = {
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                gnipDataSourceLink: linkTo(gnipDataSource.showUrl(), gnipDataSource.name()),
                destinationTable: model.get('destinationTable')
            };
        });

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.GnipStreamImportFailed.default",
                activity_data
            );
            expect(presenter.isFailure()).toBe(true);
        });
    });

    context("workspace import created event", function() {
        var activity_data;
        beforeEach(function () {
            datasetModel = rspecFixtures.dataset();
            model = rspecFixtures.activity.workspaceImportCreated({dataset: datasetModel});
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            sourceDataset = model.importSource();

            activity_data = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                datasetType: t("dataset.entitySubtypes.table"),
                destObjectOrName: linkTo(dataset.showUrl(), dataset.name())
            };
        });
        context("when called with a DATASET_IMPORT_CREATED event", function () {
            it("blank out the without_workspace style and use default instead", function () {
                presenter.options.displayStyle = ["without_workspace"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.WorkspaceImportCreated.default",
                    activity_data
                );
            });
            context("when importing to a new table", function () {
                beforeEach(function() {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.workspaceImportCreated();
                    dataset = model.dataset();
                    presenter = new chorus.presenters.Activity(model);
                    activity_data["destObjectOrName"] =  "other_table";
                });
                it("displays the destination table name without link", function () {
                    rspecFixtures.activity.workspaceImportCreated();
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.WorkspaceImportCreated.default",
                        activity_data
                    );
                });
            });
            context("when importing to an existing table", function () {
                beforeEach(function () {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.workspaceImportCreated({dataset: datasetModel});
                    dataset = model.dataset();
                    presenter = new chorus.presenters.Activity(model);
                });
                it("displays the destination table name with dataset link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.WorkspaceImportCreated.default", {
                            actorLink: linkTo(actor.showUrl(), actor.name()),
                            importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                            datasetType: t("dataset.entitySubtypes.table"),
                            destObjectOrName: linkTo(dataset.showUrl(), dataset.name()),
                            workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                    }
                    );
                });
            });
        });
    });

    context("import schedule updated event", function() {
        var activity_data;
        beforeEach(function () {
            datasetModel = rspecFixtures.dataset();
            model = rspecFixtures.activity.importScheduleUpdated({dataset: datasetModel});            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            sourceDataset = model.importSource();

            activity_data = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                datasetType: t("dataset.entitySubtypes.table"),
                destObjectOrName: linkTo(dataset.showUrl(), dataset.name())
            };
        });
        context("when called with a IMPORT SCHEDULE UPDATED event", function () {
            it("uses the without_workspace style ", function () {
                presenter.options.displayStyle = ["without_workspace"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.ImportScheduleUpdated.without_workspace",
                    activity_data
                );
            });
            context("when importing to a new table", function () {
                beforeEach(function() {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.importScheduleUpdated();
                    dataset = model.dataset();
                    presenter = new chorus.presenters.Activity(model);
                    activity_data["destObjectOrName"] =  "other_table";
                });
                it("displays the destination table name without link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ImportScheduleUpdated.default",
                        activity_data
                    );
                });
            });
            context("when importing to an existing table", function () {
                beforeEach(function () {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.importScheduleUpdated({dataset: datasetModel});
                    dataset = model.dataset();
                    presenter = new chorus.presenters.Activity(model);
                });
                it("displays the destination table name with dataset link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ImportScheduleUpdated.default", {
                            actorLink: linkTo(actor.showUrl(), actor.name()),
                            importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                            datasetType: t("dataset.entitySubtypes.table"),
                            destObjectOrName: linkTo(dataset.showUrl(), dataset.name()),
                            workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                        }
                    );
                });
            });
        });
    });

    context("import schedule deleted event", function() {
        var activity_data;
        beforeEach(function () {
            datasetModel = rspecFixtures.dataset();
            model = rspecFixtures.activity.importScheduleDeleted({dataset: datasetModel});            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            sourceDataset = model.importSource();

            activity_data = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                datasetType: t("dataset.entitySubtypes.table"),
                destObjectOrName: linkTo(dataset.showUrl(), dataset.name())
            };
        });
        context("when called with a IMPORT SCHEDULE DELETED event", function () {
            it("uses the without_workspace style ", function () {
                presenter.options.displayStyle = ["without_workspace"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.ImportScheduleDeleted.without_workspace",
                    activity_data
                );
            });
            context("when importing to a new table", function () {
                beforeEach(function() {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.importScheduleDeleted();
                    dataset = model.dataset();
                    presenter = new chorus.presenters.Activity(model);
                    activity_data["destObjectOrName"] =  "other_table_deleted";
                });
                it("displays the destination table name without link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ImportScheduleDeleted.default",
                        activity_data
                    );
                });
            });
            context("when importing to an existing table", function () {
                beforeEach(function () {
                    datasetModel = rspecFixtures.dataset();
                    model = rspecFixtures.activity.importScheduleDeleted({dataset: datasetModel});
                    dataset = model.dataset();
                    presenter = new chorus.presenters.Activity(model);
                });
                it("displays the destination table name with dataset link", function () {
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ImportScheduleDeleted.default", {
                            actorLink: linkTo(actor.showUrl(), actor.name()),
                            importSourceDatasetLink: linkTo(sourceDataset.showUrl(), sourceDataset.name()),
                            datasetType: t("dataset.entitySubtypes.table"),
                            destObjectOrName: linkTo(dataset.showUrl(), dataset.name()),
                            workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                        }
                    );
                });
            });
        });
    });

    context("chorus view created event", function() {
        context("from dataset", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.chorusViewCreatedFromDataset();
                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
                workspace = model.workspace();
                dataset = model.dataset();
                var sourceObject = new chorus.models.WorkspaceDataset(model.get('sourceObject'));
                sourceObject.set({workspace: workspace});
                model.set({sourceObject: sourceObject});

                this.translation_params = {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    chorusViewSourceLink: linkTo(sourceObject.showUrl(), sourceObject.name()),
                    chorusViewSourceType: t("dataset.entitySubtypes.table"),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                };
            });

            context("without workspace", function() {
                it("has the right header html", function() {
                    presenter.options.displayStyle = ["without_workspace"];
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ChorusViewCreated.without_workspace", this.translation_params
                    );
                });
            });

            context("with workspace", function() {
                it("has the right header html", function() {
                    presenter.options.displayStyle = ["default"];
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ChorusViewCreated.default", this.translation_params
                    );
                });
            });

            itHasTheActorIcon();
        });

        context("from duplication of a ChorusView", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.chorusViewCreatedFromDataset();
                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
                workspace = model.workspace();
                dataset = model.dataset();
                var sourceObject = new chorus.models.WorkspaceDataset(model.get('sourceObject'));
                sourceObject.set({objectType: "CHORUS_VIEW"});
                sourceObject.set({workspace: workspace});
                model.set({sourceObject: sourceObject});

                this.translation_params = {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    chorusViewSourceLink: linkTo(sourceObject.showUrl(), sourceObject.name()),
                    chorusViewSourceType: t("dataset.entitySubtypes.query"),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                };
            });

            context("without workspace", function() {
                it("has the right header html", function() {
                    presenter.options.displayStyle = ["without_workspace"];
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ChorusViewCreated.without_workspace", this.translation_params
                    );
                });
            });

            context("with workspace", function() {
                it("has the right header html", function() {
                    presenter.options.displayStyle = ["default"];
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ChorusViewCreated.default", this.translation_params
                    );
                });
            });

            itHasTheActorIcon();
        });

        context("from workfile", function() {
            beforeEach(function() {
                model = rspecFixtures.activity.chorusViewCreatedFromWorkfile();
                presenter = new chorus.presenters.Activity(model);
                actor = model.actor();
                workspace = model.workspace();
                dataset = model.dataset();
                var sourceObject = new chorus.models.Workfile(model.get('sourceObject'));
                this.translation_params = {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    chorusViewSourceLink: linkTo(sourceObject.showUrl(), sourceObject.name()),
                    chorusViewSourceType: 'workfile',
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                };
            });

            context("without workspace", function() {
                it("has the right header html", function() {
                    presenter.options.displayStyle = ["without_workspace"];
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ChorusViewCreated.without_workspace", this.translation_params
                    );
                });
            });

            context("with workspace", function() {
                it("has the right header html", function() {
                    presenter.options.displayStyle = ["default"];
                    expect(presenter.headerHtml().toString()).toMatchTranslation(
                        "activity.header.ChorusViewCreated.default", this.translation_params
                    );
                });
            });

            itHasTheActorIcon();
        });
    });

    context("dataset changed query event", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.chorusViewChanged();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();

            this.translation_params = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name())
            };
        });

        context("without workspace", function() {
            it("has the right header html", function() {
                presenter.options.displayStyle = ["without_workspace"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.ChorusViewChanged.without_workspace", this.translation_params
                );
            });
        });

        context("with workspace", function() {
            it("has the right header html", function() {
                presenter.options.displayStyle = ["default"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.ChorusViewChanged.default", this.translation_params
                );
            });
        });

        itHasTheActorIcon();
    });

    context("database view created from chorus view", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.viewCreated();
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            var chorusView = model.importSource(); // importSource association in activity.js is same as sourceDataset

            this.translation_params = {
                actorLink: linkTo(actor.showUrl(), actor.name()),
                datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                workspaceLink: linkTo(workspace.showUrl(), workspace.name()),
                chorusViewLink: linkTo(chorusView.showUrl(), chorusView.name())
            };
        });

        context("without workspace", function() {
            it("has the right header html", function() {
                presenter.options.displayStyle = ["without_workspace"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.ViewCreated.without_workspace", this.translation_params
                );
            });
        });

        context("with workspace", function() {
            it("has the right header html", function() {
                presenter.options.displayStyle = ["default"];
                expect(presenter.headerHtml().toString()).toMatchTranslation(
                    "activity.header.ViewCreated.default", this.translation_params
                );
            });
        });

        itHasTheActorIcon();
    });

    context("tableau workbook published", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.tableauWorkbookPublished({
                workspace: { id: 55, name: "paleo_eaters" },
                workbookName: "fancy_workbook",
                workbookUrl: "http://example.com/workbooks/fancy_workbook",
                projectName: "default",
                projectUrl: "http://defaultproject.com"
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.TableauWorkbookPublished.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    datasetType: t("dataset.entitySubtypes.query"),
                    tableauWorkbookLink: "<a href='http://example.com/workbooks/fancy_workbook' target='_blank'>fancy_workbook</a>",
                    tableauProjectLink: "<a href='http://defaultproject.com' target='_blank'>default</a>"
                }
            );
        });
    });

    context("tableau workbook published", function() {
        beforeEach(function() {
            model = rspecFixtures.activity.tableauWorkfileCreated({
                workspace: { id: 55, name: "paleo_eaters" },
                workbookName: "fancy_workbook"
            });
            presenter = new chorus.presenters.Activity(model);
            actor = model.actor();
            workspace = model.workspace();
            dataset = model.dataset();
            workfile = model.workfile();
        });

        itHasTheActorIcon();

        it("has the right header html", function() {
            expect(presenter.headerHtml().toString()).toMatchTranslation(
                "activity.header.TableauWorkfileCreated.default", {
                    actorLink: linkTo(actor.showUrl(), actor.name()),
                    datasetLink: linkTo(dataset.showUrl(), dataset.name()),
                    datasetType: t("dataset.entitySubtypes.query"),
                    workfileLink: linkTo(workfile.showUrl(), workfile.name()),
                    workspaceLink: linkTo(workspace.showUrl(), workspace.name())
                }
            );
        });
    });
});


