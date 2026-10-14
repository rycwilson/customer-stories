# frozen_string_literal: true

module CompaniesHelper
  def invitation_template_select_html(company)
    escape_once(render('invitation_templates/inline_select', { company: }))
  end

  def cta_item_text(cta)
    meta = [cta.type == 'CtaLink' ? 'LINK' : 'FORM', cta.primary? ? 'MAIN' : nil].compact.join(', ')
    "<small class=\"list-group-item__meta\">[ #{meta} ]</small>&nbsp;&nbsp;".html_safe + cta.description
  end
end
