puts require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper')) ; puts __FILE__

describe "Import Console" do
  let(:user) {users(:admin)}

  before do
    login user
  end

  let(:dataset) { datasets(:real_chorus_view) }
  let(:workspace) { dataset.workspace }
  let(:deleted_workspace) { FactoryGirl.create :workspace, :sandbox => workspace.sandbox, :owner => user, :name => "deleted workspace" }

  let(:deleted_table) {datasets(:table)}
  let(:other_table) {datasets(:other_table)}

  before do
    Import.delete_all # remove existing fixtures

    FactoryGirl.create :import, :source_dataset => dataset, :workspace => workspace, :to_table => "forever_table", :user => user
    FactoryGirl.create :import, :source_dataset => deleted_table, :workspace => workspace, :to_table => "import_of_deleted_table", :user => user
    FactoryGirl.create :import, :source_dataset => other_table, :workspace => deleted_workspace, :to_table => "import_to_deleted_workspace", :user => user
    deleted_table.destroy
    deleted_workspace.destroy
  end

  it "shows a list of pending imports" do
    visit '/import_console'
    source_path = "#{dataset.schema.database.name}.#{dataset.schema.name}.#{dataset.name}"
    destination_path = "#{workspace.sandbox.database.name}.#{workspace.sandbox.name}.forever_table"
    page.should have_content source_path
    page.should have_content destination_path
  end
end
