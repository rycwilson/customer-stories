class AddQuoteAttributionColumnsToStories < ActiveRecord::Migration
  def change
    add_column :stories, :quote_attr_name, :string
    add_column :stories, :quote_attr_title, :string
  end
end
