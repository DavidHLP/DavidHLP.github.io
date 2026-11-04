function Pandoc(doc)
  local name, profile, body
  doc:walk({
    Div = function(block)
      if block.classes:includes("resume-export-identity") then
        for _, child in ipairs(block.content) do
          if child.t == "Header" and child.level == 1 then name = child.content end
          if child.t == "Div" and child.classes:includes("profile-details") then
            profile = child.content
          end
        end
      elseif block.classes:includes("resume-export-body") then
        body = block.content
      end
    end
  })
  assert(name and profile and body, "Missing About name, profile or résumé body")

  local blocks = pandoc.List({pandoc.Header(1, name, pandoc.Attr("resume-name"))})
  for _, block in ipairs(profile) do
    if block.t == "BulletList" then
      local contacts = pandoc.List()
      for _, item in ipairs(block.content) do
        if #contacts > 0 then contacts:extend({pandoc.Space(), pandoc.Str("·"), pandoc.Space()}) end
        contacts:extend(item[1].content)
      end
      blocks:insert(pandoc.Para(contacts))
    else
      blocks:insert(block)
    end
  end
  blocks:extend(body)

  local url = pandoc.utils.stringify(doc.meta["resume-url"])
  local origin = url:match("^https?://[^/]+")
  return pandoc.Pandoc(blocks):walk({
    Link = function(link)
      local target = link.target
      if target:match("^//") then
        link.target = url:match("^https?:") .. target
      elseif target:match("^/") then
        link.target = origin .. target
      elseif not target:match("^[%a][%w+.-]*:") and not target:match("^#") then
        link.target = url .. target
      end
      return link
    end,
    Span = function(span)
      if span.classes:includes("resume-section-number") or span.attributes["aria-hidden"] == "true" then
        return {}
      end
    end,
  })
end
