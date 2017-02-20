namespace :temp do

  desc "temp stuff"

  task cta: :environment do

    # OutboundAction.all.each do |action|
    #   if action.type == 'OutboundLink'
    #     type = 'CTALink'
    #   elsif action.type == 'OutboundForm'
    #     type = 'CTAForm'
    #   else
    #     puts "No type: #{action}"
    #   end
    #   new_cta = action.attributes
    #   new_cta['type'] = type
    #   CallToAction.create(new_cta)
    # end

    # OutboundActionsStory.all.each do |entry|
    #   success_id = Story.find(entry.story_id).success.id
    #   CtasSuccess.create({
    #     call_to_action_id: entry.outbound_action_id,
    #     success_id: success_id
    #   })
    # end

    CtaButton.all.each do |button|
      CallToAction.create({
        type: 'CTALink',
        company_id: button.company_id,
        link_url: button.url,
        display_text: button.btn_text
      })
    end

  end

end
