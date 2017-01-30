class AddBackgroundColorToCtaButtons < ActiveRecord::Migration
  def change
    add_column :cta_buttons, :background_color, :string, default: '#ff6600'
  end
end
