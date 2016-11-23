class RenameOutboundLinkToOutboundAction < ActiveRecord::Migration

  def change
    rename_table :outbound_links, :outbound_actions
    rename_column :outbound_actions, :url, :link_url
    rename_column :outbound_actions, :link_text, :link_display_text
    add_column :outbound_actions, :type, :string
    add_column :outbound_actions, :html, :text
    add_column :outbound_actions, :html_display_text, :string
    rename_table :outbound_links_stories, :outbound_actions_stories
    rename_column :outbound_actions_stories, :outbound_link_id,
                    :outbound_action_id
  end

end