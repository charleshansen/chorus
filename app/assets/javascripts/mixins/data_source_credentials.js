chorus.Mixins.DataSourceCredentials = {};

chorus.Mixins.DataSourceCredentials.model = {
    dataSourceRequiringCredentials: function() {
        return new chorus.models.DataSource({id: this.serverErrors.model_data.id});
    }
};

chorus.Mixins.DataSourceCredentials.page = {
    dependentResourceForbidden: function(resource) {
        var dataSource = resource.dataSourceRequiringCredentials && resource.dataSourceRequiringCredentials();

        if (dataSource) {
            var dialog = new chorus.dialogs.InstanceAccount({
                title: t("instances.account.add.title"),
                instance: dataSource,
                reload: true,
                goBack: true
            });
            dialog.launchModal();
        } else {
            this._super("dependentResourceForbidden", arguments);
        }
    }
};
