class RenameFieldsInOutboundActions < ActiveRecord::Migration

  def change
    rename_column :outbound_actions, :html, :form_html
    rename_column :outbound_actions, :html_display_text, :display_text
    remove_column :outbound_actions, :link_display_text, :string
  end

end
