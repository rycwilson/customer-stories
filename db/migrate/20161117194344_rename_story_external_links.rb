class RenameStoryExternalLinks < ActiveRecord::Migration
  def change
    rename_column :story_external_links_stories, :story_external_link_id, :outbound_link_id
    rename_table :story_external_links, :outbound_links
    rename_table :story_external_links_stories, :outbound_links_stories
  end
end
