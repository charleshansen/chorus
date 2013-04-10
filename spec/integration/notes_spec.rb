puts require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper')) ; puts __FILE__

describe "Notes" do
  before do
    login(users(:admin))
  end
  
  describe "creating a note on a GPDB instance" do
    it "contains the note" do
      instance = data_sources(:default)
      visit("#/data_sources")
      within ".data_source ul" do
        find("li", :text => instance.name).click
      end
      click_link "Add a note"

      within_modal do
        set_cleditor_value("body", "Note on the instance")
        click_button "Add Note"
      end

      instance.events.last.body.should == "Note on the instance"
    end
  end

  describe "creating a note on a workspace" do
    it "creates the note" do
      workspace = workspaces(:public_with_no_collaborators)
      visit("#/workspaces/#{workspace.id}")
      click_link "Add a note"

      within_modal do
        set_cleditor_value("body", "Note on the workspace")
        click_button "Add Note"
      end

      workspace.reload.events.last.body.should == "Note on the workspace"
    end
  end

  describe "creating a note on a hadoop data source" do
    it "creates the note" do
      hdfs_data_source = hdfs_data_sources(:hadoop)
      visit("#/data_sources")
      within ".hdfs_data_source ul" do
        find("li", :text => hdfs_data_source.name).click
      end
      click_link "Add a note"

      within_modal do
        set_cleditor_value("body", "Note on the hadoop data source")
        click_button "Add Note"
      end

      hdfs_data_source.events.last.body.should == "Note on the hadoop data source"
    end
  end

  describe "creating a note on a workfile" do
    it "creates the note" do
      workfile = workfiles(:no_collaborators_public)
      workspace = workfile.workspace
      visit("#/workspaces/#{workspace.id}/workfiles")
      within ".selectable.list" do
        find("li", :text => workfile.file_name).click
      end
      click_link "Add a note"

      within_modal do
        set_cleditor_value("body", "Note on a workfile")
        click_button "Add Note"
      end

      workfile.events.last.body.should == "Note on a workfile"
    end
  end

  describe "creating a note with an attachment" do
    it "creates the note" do
      Tempfile.open "test_upload" do |tempfile|
        workfile = workfiles(:no_collaborators_public)
        workspace = workfile.workspace
        visit("#/workspaces/#{workspace.id}/workfiles")
        within ".selectable.list" do
          find("li", :text => workfile.file_name).click
        end
        click_link "Add a note"

        within_modal do
          set_cleditor_value("body", "Note on a workfile")
          click_on "Show options"
          attach_file "contents", "file://" + tempfile.path
          click_button "Add Note"
        end

        workfile.events.last.body.should == "Note on a workfile"
        page.should have_text(File.basename(tempfile.path))
      end
    end
  end
end

