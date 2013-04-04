chorus.views.WorkspaceShowSidebar = chorus.views.Sidebar.extend({
    constructorName: "WorkspaceShowSidebarView",
    templateName:"workspace_show_sidebar",

    subviews: {
        ".workspace_member_list": "workspaceMemberList"
    },

    setup:function () {
        this.bindings.add(this.model, "image:change", this.render);
        this.workspaceMemberList = new chorus.views.WorkspaceMemberList({collection: this.model.members()});
    },

    additionalContext:function () {
        return {
            workspaceAdmin:this.model.workspaceAdmin(),
            imageUrl:this.model.fetchImageUrl(),
            hasImage:this.model.hasImage(),
            hasSandbox:!!this.model.sandbox(),
            canUpdate: this.model.canUpdate(),
            active: this.model.isActive(),
            canKaggle: chorus.models.Config.instance().get("kaggleConfigured") && this.model.canUpdate() && this.model.isActive(),
            kaggleUrl: this.model.showUrl() + "/kaggle",
            managerName: this.model.manager && (this.model.manager().get('firstName') + " " + this.model.manager().get('lastName'))
        };
    },

    postRender:function () {
        var self = this;
        this.$(".workspace_image").load(function () {
            self.$(".after_image").removeClass("hidden");
        });
        this.$('.workspace_image').load(_.bind(this.recalculateScrolling, this));
        this._super('postRender');
    }
});
