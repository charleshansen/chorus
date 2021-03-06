require 'spec_helper'

describe GpdbDataset do
  let(:gpdb_data_source) { data_sources(:owners) }
  let(:account) { gpdb_data_source.owner_account }
  let(:schema) { schemas(:default) }
  let(:other_schema) { schemas(:other_schema) }
  let(:dataset) { datasets(:table) }
  let(:source_table) { datasets(:source_table) }
  let(:dataset_view) { datasets(:view) }

  describe "#instance_account_ids" do
    it "returns instance account ids with access to the database" do
      dataset.instance_account_ids.should == dataset.database.instance_account_ids
    end
  end

  describe "associations" do
    it { should have_many :associated_datasets }
    it { should have_many :bound_workspaces }

  end

  context ".total_entries" do
    before do
      connection = Object.new
      stub(schema).connect_with(account) { connection }
      stub(connection).datasets_count { 3 }
    end

    it "returns the number of total entries" do
      GpdbDataset.total_entries(account, schema).should == 3
    end
  end

  describe "#can_import_from", :greenplum_integration do
    let(:schema) { GpdbSchema.find_by_name('test_schema') }
    let(:dataset) { schema.datasets.find_by_name('base_table1') }

    context "when tables have same column number, names and types" do
      let(:source) { schema.datasets.find_by_name('view1') }

      it "says tables are consistent" do
        dataset.can_import_from(source).should be_true
      end
    end

    context "when tables have same column number and types, but different names" do
      let(:source) { schema.datasets.find_by_name('different_names_table') }

      it "says tables are not consistent" do
        dataset.can_import_from(source).should be_false
      end
    end

    context "when tables have same column number and names, but different types" do
      let(:source) { schema.datasets.find_by_name('different_types_table') }

      it "says tables are not consistent" do
        dataset.can_import_from(source).should be_false
      end
    end

    context "when tables have different number of columns" do
      let(:source) { schema.datasets.find_by_name('master_table1') }

      it "says tables are not consistent" do
        dataset.can_import_from(source).should be_false
      end
    end
  end

  describe "#destroy" do
    let(:dataset) { datasets(:table) }

    it "should not delete the dataset entry" do
      dataset.destroy
      expect {
        dataset.reload
      }.to_not raise_error(Exception)
    end

    it "should update the deleted_at field" do
      dataset.destroy
      dataset.reload.deleted_at.should_not be_nil
    end

    it "destroys dependent import_schedules" do
      schedules = dataset.import_schedules
      schedules.length.should > 0

      dataset.destroy
      schedules.each do |schedule|
        ImportSchedule.find_by_id(schedule.id).should be_nil
      end
    end

    it "destroys dependent tableau_workbook_publications" do
      tableau_publication = tableau_workbook_publications(:default)
      dataset = tableau_publication.dataset

      dataset.destroy
      TableauWorkbookPublication.find_by_id(tableau_publication.id).should be_nil
    end

    it "destroys dependent associated_datasets" do
      associated_dataset = AssociatedDataset.first
      dataset = associated_dataset.dataset

      dataset.destroy
      AssociatedDataset.find_by_id(associated_dataset.id).should be_nil
    end
  end
end
