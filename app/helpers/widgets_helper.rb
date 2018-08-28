module WidgetsHelper

  def params_to_data_attrs (params)
    [
      params[:stories].present? ? "data-stories=#{params[:stories]}" : '',
      params[:category].present? ? "data-category=#{params[:category]}" : '',
      params[:product].present? ? "data-product=#{params[:product]}" : '',
      params[:background].present? ? "data-background=#{params[:background]}" : '',
      params[:tab_color].present? ? "data-tab-color=#{params[:tab_color]}" : '',
      params[:text_color].present? ? "data-text-color=#{params[:text_color]}" : '',
      params[:delay].present? ? "data-delay=#{params[:delay]}" : '',
    ]
      .delete_if { |attr| attr.blank? }
      .join(' ')
  end

  # method provides for auto-populating settings for legacy widgets
  def tabbedCarouselStyle (company, tab_color, text_color, is_external=true)
    return "" if !is_external
    case company.subdomain
    when 'trunity'
      tab_color = '#FEBE57' if tab_color.blank?
      text_color = '#ffffff' if text_color.blank?
    when 'retailnext'
      tab_color = '#ffd400' if tab_color.blank?
      text_color = '#000000' if text_color.blank?
    else
      tab_color = tab_color || "#efefef"
      text_color = text_color || "#333333"
    end
    "background-color: #{tab_color}; color: #{text_color}"
  end

end