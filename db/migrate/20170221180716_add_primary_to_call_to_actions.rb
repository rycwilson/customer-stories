class AddPrimaryToCallToActions < ActiveRecord::Migration

  def change
    add_column :call_to_actions, :primary, :boolean, default: false
  end

end
