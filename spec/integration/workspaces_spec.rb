puts require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper')) ; puts __FILE__

describe "Workspaces" do
  before do
    login(users(:admin))
  end

  let(:workspace) { workspaces(:public) }

  describe "Create workspaces" do
    it "creates a private workspace" do
      visit('#/workspaces')
      click_button "Create Workspace"
      within_modal do
        fill_in 'name', :with => "New Workspace"
        uncheck "Make this workspace publicly available"
        click_button "Create Workspace"
      end
      click_link "Dismiss the workspace quick start guide"
      logout
      login(users(:no_collaborators))
      visit('#/workspaces')
      page.should_not have_content ("Private Workspace")
    end

    it "creates a public workspace" do
      visit('#/workspaces')
      click_button "Create Workspace"
      within_modal do
        fill_in 'name', :with => "New Workspace"
        click_button "Create Workspace"
      end
      click_link "Dismiss the workspace quick start guide"
      page.should have_content('All Activity')
      Workspace.find_by_name("New Workspace").should_not be_nil
    end
  end

  describe "Edit a workspace" do
    it "uploads an image for a workspace" do
      visit("#/workspaces/#{workspace.id}")
      click_link "Edit Workspace"
      attach_file("image_upload_input", File.join(File.dirname(__FILE__), '../fixtures/User.png'))
      click_button "Save Changes"
      page.should have_selector(".breadcrumb:contains('#{workspace.name}')")
      workspace.reload.image.original_filename.should == 'User.png'
    end
  end

  describe "Delete a workspace" do

    it "deletes the workspace" do
      visit("#/workspaces/#{workspace.id}")
      click_link "Delete this Workspace"
      page.should have_selector(".submit")
      find(".submit").click

      visit('/#/workspaces')
      within '.content_footer' do
        page.should have_no_selector(".loading_section")
      end

      find('a', :text => "Active Workspaces", :visible => true).click
      find('a', :text => "All Workspaces", :visible => true).click
      within ".list" do
        page.should have_css("a[href='#/workspaces/#{Workspace.first.id}']")
        page.should_not have_css("a[href='#/workspaces/#{workspace.id}']")
      end
    end
  end
end